"""ServicePilot AI 本地 HTTP 服务。"""

from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit

from engine import KnowledgeBase, ServicePilotAgent, redact_sensitive
from ollama_client import MODEL, enabled, is_available
from roi import calculate_roi
from ticket_store import DEFAULT_DATABASE_PATH, TicketStore


APP_VERSION = "1.0.0"
DEFAULT_HOST = os.getenv("SERVICEPILOT_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.getenv("SERVICEPILOT_PORT", "8770"))
MAX_REQUEST_BYTES = 1_000_000
ROOT = Path(__file__).parent
WEB_ROOT = ROOT / "web"
EVALUATION_PATH = ROOT / "outputs" / "evaluation.json"

STATIC_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
}


class ServicePilotHandler(BaseHTTPRequestHandler):
    server_version = f"ServicePilot/{APP_VERSION}"

    @property
    def store(self) -> TicketStore:
        return self.server.store  # type: ignore[attr-defined]

    @property
    def agent(self) -> ServicePilotAgent:
        return self.server.agent  # type: ignore[attr-defined]

    @property
    def knowledge(self) -> KnowledgeBase:
        return self.server.knowledge  # type: ignore[attr-defined]

    def _send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.end_headers()
        self.wfile.write(body)

    def _send_error_json(self, status: HTTPStatus, code: str, message: str) -> None:
        self._send_json(status, {"error": {"code": code, "message": message}})

    def _send_static(self, filename: str, content_type: str) -> None:
        try:
            body = (WEB_ROOT / filename).read_bytes()
        except OSError:
            self._send_error_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                "STATIC_UNAVAILABLE",
                "网页资源暂时不可用。",
            )
            return
        self.send_response(HTTPStatus.OK.value)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self'; "
            "img-src 'self' data:; connect-src 'self'; base-uri 'none'; "
            "form-action 'self'; frame-ancestors 'none'",
        )
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any] | None:
        if self.headers.get_content_type() != "application/json":
            self._send_error_json(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                "UNSUPPORTED_MEDIA_TYPE",
                "请使用 application/json。",
            )
            return None
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_error_json(
                HTTPStatus.BAD_REQUEST, "INVALID_CONTENT_LENGTH", "Content-Length 无效。"
            )
            return None
        if content_length < 0 or content_length > MAX_REQUEST_BYTES:
            self._send_error_json(
                HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                "REQUEST_TOO_LARGE",
                "请求数据不能超过 1 MB。",
            )
            return None
        try:
            raw = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(raw)
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_error_json(
                HTTPStatus.BAD_REQUEST, "INVALID_JSON", "请求不是有效的 UTF-8 JSON。"
            )
            return None
        if not isinstance(payload, dict):
            self._send_error_json(
                HTTPStatus.BAD_REQUEST, "INVALID_PAYLOAD", "请求必须是 JSON 对象。"
            )
            return None
        return payload

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlsplit(self.path)
        path = parsed.path
        if path == "/api/health":
            self._send_json(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "version": APP_VERSION,
                    "storage": "local_sqlite",
                    "model": MODEL,
                    "ollama_enabled": enabled(),
                    "ollama_available": is_available(),
                },
            )
            return
        if path == "/api/tickets":
            query = parse_qs(parsed.query)
            try:
                tickets = self.store.list(
                    status=query.get("status", [None])[0],
                    category=query.get("category", [None])[0],
                    limit=int(query.get("limit", ["20"])[0]),
                )
            except (ValueError, TypeError):
                self._send_error_json(
                    HTTPStatus.BAD_REQUEST, "INVALID_FILTER", "筛选参数无效。"
                )
                return
            self._send_json(HTTPStatus.OK, {"tickets": tickets})
            return
        if path.startswith("/api/tickets/"):
            ticket_id = path.removeprefix("/api/tickets/").strip("/")
            if not ticket_id or "/" in ticket_id:
                self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "工单不存在。")
                return
            ticket = self.store.get(ticket_id)
            if ticket is None:
                self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "工单不存在。")
                return
            self._send_json(HTTPStatus.OK, {"ticket": ticket})
            return
        if path.startswith("/api/knowledge/"):
            doc_id = path.removeprefix("/api/knowledge/").strip("/")
            if not doc_id or "/" in doc_id:
                self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "知识文档不存在。")
                return
            document = self.knowledge.get(doc_id)
            if document is None:
                self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "知识文档不存在。")
                return
            self._send_json(HTTPStatus.OK, {"document": document})
            return
        if path == "/api/evaluation/latest":
            if not EVALUATION_PATH.exists():
                self._send_json(
                    HTTPStatus.OK,
                    {"status": "not_run", "message": "请运行 python evaluate.py 生成评测结果。"},
                )
                return
            self._send_json(
                HTTPStatus.OK,
                json.loads(EVALUATION_PATH.read_text(encoding="utf-8")),
            )
            return
        if path == "/api/metrics":
            self._send_json(
                HTTPStatus.OK,
                {"operations": self.store.metrics(), "roi": calculate_roi()},
            )
            return
        static = STATIC_FILES.get(path)
        if static:
            self._send_static(*static)
            return
        self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "接口不存在。")

    def do_POST(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        payload = self._read_json()
        if payload is None:
            return
        if path == "/api/agent/run":
            try:
                result = self.agent.run(payload)
            except ValueError:
                self._send_error_json(
                    HTTPStatus.BAD_REQUEST,
                    "MISSING_REQUIRED_FIELDS",
                    "请填写工单主题和问题描述。",
                )
                return
            except Exception:
                self._send_error_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    "AGENT_FAILED",
                    "Agent 暂时不可用，已建议转人工。",
                )
                return
            self._send_json(HTTPStatus.OK, result)
            return
        if path == "/api/tickets":
            try:
                ticket = self.store.create({
                    "idempotency_key": payload.get("idempotency_key"),
                    "subject": redact_sensitive(str(payload.get("subject", ""))),
                    "description": redact_sensitive(str(payload.get("description", ""))),
                    "channel": payload.get("channel", "api"),
                    "customer_tier": payload.get("customer_tier", "standard"),
                    "category": payload.get("category", "unknown"),
                    "category_label": payload.get("category_label", "待确认"),
                    "category_confidence": payload.get("category_confidence", 0),
                    "priority": payload.get("priority", "P2"),
                    "extracted": payload.get("extracted", {}),
                    "status": payload.get("status", "new"),
                    "handoff_reasons": payload.get("handoff_reasons", []),
                })
            except ValueError as exc:
                self._send_error_json(
                    HTTPStatus.BAD_REQUEST, str(exc).upper(), "工单数据无效。"
                )
                return
            self._send_json(HTTPStatus.CREATED, {"ticket": ticket})
            return
        self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "接口不存在。")

    def do_PATCH(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if not path.startswith("/api/tickets/"):
            self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "接口不存在。")
            return
        ticket_id = path.removeprefix("/api/tickets/").strip("/")
        if not ticket_id or "/" in ticket_id:
            self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "工单不存在。")
            return
        payload = self._read_json()
        if payload is None:
            return
        try:
            ticket = self.store.update_status(
                ticket_id,
                str(payload.get("status", "")),
                int(payload.get("version", 0)),
            )
        except ValueError:
            self._send_error_json(HTTPStatus.BAD_REQUEST, "INVALID_STATUS", "工单状态无效。")
            return
        except RuntimeError:
            self._send_error_json(
                HTTPStatus.CONFLICT,
                "VERSION_CONFLICT",
                "工单已被其他操作更新，请刷新后重试。",
            )
            return
        if ticket is None:
            self._send_error_json(HTTPStatus.NOT_FOUND, "NOT_FOUND", "工单不存在。")
            return
        self._send_json(HTTPStatus.OK, {"ticket": ticket})

    def log_message(self, format: str, *args: Any) -> None:
        # 保留方法、状态码和路径，不记录请求正文。
        super().log_message(format, *args)


def create_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    *,
    store_path: str | Path = DEFAULT_DATABASE_PATH,
) -> ThreadingHTTPServer:
    store = TicketStore(store_path)
    knowledge = KnowledgeBase()
    server = ThreadingHTTPServer((host, port), ServicePilotHandler)
    server.store = store  # type: ignore[attr-defined]
    server.knowledge = knowledge  # type: ignore[attr-defined]
    server.agent = ServicePilotAgent(store, knowledge)  # type: ignore[attr-defined]
    return server


def run() -> None:
    try:
        server = create_server()
    except OSError as exc:
        raise SystemExit(f"端口 {DEFAULT_PORT} 已被占用，请关闭旧服务后重试。") from exc
    print(f"ServicePilot AI v{APP_VERSION} 已启动：http://{DEFAULT_HOST}:{DEFAULT_PORT}")
    print("数据仅保存在本机 data/tickets.db；按 Ctrl+C 停止服务。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在停止服务……")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
