# API 文档

基础地址：`http://127.0.0.1:8770`

## Agent 运行

`POST /api/agent/run`

```json
{
  "subject": "不是物流问题，是退款未到账",
  "description": "不是物流问题，而是订单 ORD-20260831011 的退款一直没到账。",
  "channel": "web",
  "customer_tier": "standard",
  "action": "create",
  "idempotency_key": "demo-001",
  "simulate_tool_failure": false
}
```

响应包含 `analysis`、`answer`、`decision`、`tool` 和 `trace`。`trace` 是工具级审计事件，不包含模型隐藏推理。

## 工单

- `POST /api/tickets`：直接创建，支持 `idempotency_key`。
- `GET /api/tickets?status=triaged&category=refund_return&limit=20`：列表与筛选。
- `GET /api/tickets/{id}`：详情。
- `PATCH /api/tickets/{id}`：状态更新。

更新示例：

```json
{"status": "in_progress", "version": 1}
```

若版本已变化，返回 `409 VERSION_CONFLICT`，调用方必须刷新后重试。

合法状态：`new`、`triaged`、`in_progress`、`waiting_customer`、`awaiting_human`、`resolved`、`closed`。

## 知识、评测与指标

- `GET /api/knowledge/{doc_id}`：返回引用文档原文与来源。
- `GET /api/evaluation/latest`：返回最近一次 40 条固定评测。
- `GET /api/metrics`：返回本地工单分布和默认 ROI 模拟。
- `GET /api/health`：版本、存储、本地模型配置和可用性。

## 错误格式

```json
{"error": {"code": "INVALID_STATUS", "message": "工单状态无效。"}}
```

请求必须使用 UTF-8 JSON，最大 1 MB。
