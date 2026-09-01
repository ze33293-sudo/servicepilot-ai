"""本地 SQLite 工单存储与乐观锁。"""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


DEFAULT_DATABASE_PATH = Path(__file__).with_name("data") / "tickets.db"
VALID_STATUSES = {
    "new",
    "triaged",
    "in_progress",
    "waiting_customer",
    "awaiting_human",
    "resolved",
    "closed",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class TicketStore:
    def __init__(self, path: str | Path = DEFAULT_DATABASE_PATH) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        connection = self._connect()
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def _init_db(self) -> None:
        with self._connection() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS tickets (
                    id TEXT PRIMARY KEY,
                    idempotency_key TEXT UNIQUE,
                    subject TEXT NOT NULL,
                    description TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    customer_tier TEXT NOT NULL,
                    category TEXT NOT NULL,
                    category_label TEXT NOT NULL,
                    category_confidence REAL NOT NULL,
                    priority TEXT NOT NULL,
                    extracted_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    handoff_reasons_json TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)"
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category)"
            )

    @staticmethod
    def _to_dict(row: sqlite3.Row) -> dict[str, Any]:
        item = dict(row)
        item["extracted"] = json.loads(item.pop("extracted_json"))
        item["handoff_reasons"] = json.loads(item.pop("handoff_reasons_json"))
        item["category_confidence"] = round(float(item["category_confidence"]), 3)
        return item

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        key = str(payload.get("idempotency_key") or "").strip() or None
        if key:
            with self._connection() as connection:
                existing = connection.execute(
                    "SELECT * FROM tickets WHERE idempotency_key = ?", (key,)
                ).fetchone()
            if existing is not None:
                result = self._to_dict(existing)
                result["idempotent_replay"] = True
                return result

        status = str(payload.get("status", "new"))
        if status not in VALID_STATUSES:
            raise ValueError("invalid_status")
        created = _now()
        ticket_id = f"TKT-{datetime.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"
        values = (
            ticket_id,
            key,
            str(payload.get("subject", "")).strip(),
            str(payload.get("description", "")).strip(),
            str(payload.get("channel", "web")),
            str(payload.get("customer_tier", "standard")),
            str(payload.get("category", "unknown")),
            str(payload.get("category_label", "待确认")),
            float(payload.get("category_confidence", 0)),
            str(payload.get("priority", "P2")),
            json.dumps(payload.get("extracted", {}), ensure_ascii=False),
            status,
            json.dumps(payload.get("handoff_reasons", []), ensure_ascii=False),
            1,
            created,
            created,
        )
        if not values[2] or not values[3]:
            raise ValueError("missing_required_fields")
        with self._connection() as connection:
            connection.execute(
                """
                INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                values,
            )
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
        assert row is not None
        result = self._to_dict(row)
        result["idempotent_replay"] = False
        return result

    def get(self, ticket_id: str) -> dict[str, Any] | None:
        with self._connection() as connection:
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
        return self._to_dict(row) if row is not None else None

    def list(
        self,
        *,
        status: str | None = None,
        category: str | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(int(limit), 100))
        clauses: list[str] = []
        params: list[Any] = []
        if status:
            if status not in VALID_STATUSES:
                raise ValueError("invalid_status")
            clauses.append("status = ?")
            params.append(status)
        if category:
            clauses.append("category = ?")
            params.append(category)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        params.append(limit)
        with self._connection() as connection:
            rows = connection.execute(
                f"SELECT * FROM tickets {where} ORDER BY created_at DESC LIMIT ?",
                params,
            ).fetchall()
        return [self._to_dict(row) for row in rows]

    def update_status(
        self,
        ticket_id: str,
        status: str,
        expected_version: int,
    ) -> dict[str, Any] | None:
        if status not in VALID_STATUSES:
            raise ValueError("invalid_status")
        with self._connection() as connection:
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
            if row is None:
                return None
            if int(row["version"]) != int(expected_version):
                raise RuntimeError("version_conflict")
            next_version = int(expected_version) + 1
            connection.execute(
                "UPDATE tickets SET status = ?, version = ?, updated_at = ? WHERE id = ?",
                (status, next_version, _now(), ticket_id),
            )
            updated = connection.execute(
                "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
        assert updated is not None
        return self._to_dict(updated)

    def metrics(self) -> dict[str, Any]:
        with self._connection() as connection:
            total = connection.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
            handoff = connection.execute(
                "SELECT COUNT(*) FROM tickets WHERE status = 'awaiting_human'"
            ).fetchone()[0]
            average = connection.execute(
                "SELECT COALESCE(AVG(category_confidence), 0) FROM tickets"
            ).fetchone()[0]
            by_status = {
                row[0]: row[1]
                for row in connection.execute(
                    "SELECT status, COUNT(*) FROM tickets GROUP BY status"
                ).fetchall()
            }
            by_category = {
                row[0]: row[1]
                for row in connection.execute(
                    "SELECT category, COUNT(*) FROM tickets GROUP BY category"
                ).fetchall()
            }
        return {
            "total_tickets": total,
            "human_handoffs": handoff,
            "handoff_rate": round(handoff / total, 3) if total else 0,
            "average_confidence": round(float(average), 3),
            "by_status": by_status,
            "by_category": by_category,
        }
