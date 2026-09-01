from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from ticket_store import TicketStore


def ticket_payload(**overrides):
    payload = {
        "subject": "测试工单",
        "description": "订单 ORD-20260831001 退款未到账。",
        "category": "refund_return",
        "category_label": "退款退货",
        "category_confidence": 0.91,
        "priority": "P2",
        "extracted": {"order_id": "ORD-20260831001"},
        "status": "triaged",
        "handoff_reasons": [],
    }
    payload.update(overrides)
    return payload


class TicketStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.store = TicketStore(Path(self.temporary.name) / "tickets.db")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_create_and_get(self) -> None:
        created = self.store.create(ticket_payload())
        fetched = self.store.get(created["id"])
        self.assertEqual(fetched["id"], created["id"])
        self.assertEqual(fetched["extracted"]["order_id"], "ORD-20260831001")

    def test_idempotency_returns_same_ticket(self) -> None:
        first = self.store.create(ticket_payload(idempotency_key="same-key"))
        second = self.store.create(ticket_payload(idempotency_key="same-key"))
        self.assertEqual(first["id"], second["id"])
        self.assertTrue(second["idempotent_replay"])

    def test_list_filters(self) -> None:
        self.store.create(ticket_payload(status="triaged"))
        self.store.create(ticket_payload(status="awaiting_human"))
        items = self.store.list(status="awaiting_human")
        self.assertEqual(len(items), 1)

    def test_update_status_increments_version(self) -> None:
        created = self.store.create(ticket_payload())
        updated = self.store.update_status(created["id"], "in_progress", 1)
        self.assertEqual(updated["status"], "in_progress")
        self.assertEqual(updated["version"], 2)

    def test_update_rejects_stale_version(self) -> None:
        created = self.store.create(ticket_payload())
        self.store.update_status(created["id"], "in_progress", 1)
        with self.assertRaisesRegex(RuntimeError, "version_conflict"):
            self.store.update_status(created["id"], "resolved", 1)

    def test_rejects_invalid_status(self) -> None:
        with self.assertRaisesRegex(ValueError, "invalid_status"):
            self.store.create(ticket_payload(status="deleted"))

    def test_metrics(self) -> None:
        self.store.create(ticket_payload())
        self.store.create(ticket_payload(status="awaiting_human", handoff_reasons=["low_confidence"]))
        metrics = self.store.metrics()
        self.assertEqual(metrics["total_tickets"], 2)
        self.assertEqual(metrics["human_handoffs"], 1)


if __name__ == "__main__":
    unittest.main()
