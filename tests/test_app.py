from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib import error, request

from app import create_server


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.temporary = tempfile.TemporaryDirectory()
        cls.server = create_server("127.0.0.1", 0, store_path=Path(cls.temporary.name) / "api.db")
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]
        cls.base = f"http://127.0.0.1:{cls.port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)
        cls.temporary.cleanup()

    def json_request(self, path: str, *, method: str = "GET", payload=None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = request.Request(
            self.base + path,
            data=data,
            headers={"Content-Type": "application/json"} if payload is not None else {},
            method=method,
        )
        with request.urlopen(req, timeout=5) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def test_health(self) -> None:
        status, payload = self.json_request("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(payload["status"], "ok")

    def test_static_page(self) -> None:
        with request.urlopen(self.base + "/", timeout=5) as response:
            html = response.read().decode("utf-8")
        self.assertIn("ServicePilot AI", html)

    def test_agent_create_and_get(self) -> None:
        status, result = self.json_request("/api/agent/run", method="POST", payload={
            "subject": "退款未到账",
            "description": "订单 ORD-20260831001 退款未到账。",
            "idempotency_key": "api-agent-create",
        })
        self.assertEqual(status, 200)
        ticket_id = result["tool"]["ticket"]["id"]
        _, fetched = self.json_request(f"/api/tickets/{ticket_id}")
        self.assertEqual(fetched["ticket"]["id"], ticket_id)

    def test_direct_create_is_idempotent(self) -> None:
        payload = {"subject": "测试", "description": "测试描述", "idempotency_key": "direct-same"}
        _, first = self.json_request("/api/tickets", method="POST", payload=payload)
        _, second = self.json_request("/api/tickets", method="POST", payload=payload)
        self.assertEqual(first["ticket"]["id"], second["ticket"]["id"])
        self.assertTrue(second["ticket"]["idempotent_replay"])

    def test_patch_and_version_conflict(self) -> None:
        _, created = self.json_request("/api/tickets", method="POST", payload={"subject": "更新", "description": "更新测试"})
        ticket_id = created["ticket"]["id"]
        _, updated = self.json_request(f"/api/tickets/{ticket_id}", method="PATCH", payload={"status": "in_progress", "version": 1})
        self.assertEqual(updated["ticket"]["version"], 2)
        with self.assertRaises(error.HTTPError) as context:
            self.json_request(f"/api/tickets/{ticket_id}", method="PATCH", payload={"status": "resolved", "version": 1})
        self.assertEqual(context.exception.code, 409)

    def test_invalid_status(self) -> None:
        with self.assertRaises(error.HTTPError) as context:
            self.json_request("/api/tickets", method="POST", payload={"subject": "无效", "description": "无效状态", "status": "deleted"})
        self.assertEqual(context.exception.code, 400)

    def test_requires_json_content_type(self) -> None:
        req = request.Request(self.base + "/api/agent/run", data=b"{}", method="POST")
        with self.assertRaises(error.HTTPError) as context:
            request.urlopen(req, timeout=5)
        self.assertEqual(context.exception.code, 415)

    def test_rejects_large_payload_before_reading(self) -> None:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        connection.putrequest("POST", "/api/agent/run")
        connection.putheader("Content-Type", "application/json")
        connection.putheader("Content-Length", "1000001")
        connection.endheaders()
        response = connection.getresponse()
        self.assertEqual(response.status, 413)
        response.read()
        connection.close()

    def test_knowledge_document(self) -> None:
        status, payload = self.json_request("/api/knowledge/KB-REF-001")
        self.assertEqual(status, 200)
        self.assertEqual(payload["document"]["id"], "KB-REF-001")

    def test_metrics(self) -> None:
        status, payload = self.json_request("/api/metrics")
        self.assertEqual(status, 200)
        self.assertIn("roi", payload)


if __name__ == "__main__":
    unittest.main()
