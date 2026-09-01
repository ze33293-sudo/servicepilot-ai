# 部署步骤

## Windows 本地启动（主验收路径）

要求：Python 3.11+、PowerShell。

```powershell
cd support-ticket-agent
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

访问 `http://127.0.0.1:8770`。运行数据在 `data/tickets.db`。

启用随项目迁移的本地 Ollama：

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1 -EnableOllama
```

脚本将使用项目根目录的 `.local/ollama/ollama.exe` 和 `.local/ollama-models/`，并设置 `OLLAMA_NO_CLOUD=1`。

## 环境变量

| 名称 | 默认值 | 说明 |
|---|---|---|
| `SERVICEPILOT_HOST` | `127.0.0.1` | 服务监听地址 |
| `SERVICEPILOT_PORT` | `8770` | 服务端口 |
| `ENABLE_OLLAMA` | `0` | 是否启用本地模型回答增强 |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama 地址 |
| `OLLAMA_MODEL` | `qwen3.5:9b` | 本地模型名 |
| `OLLAMA_TIMEOUT_SECONDS` | `45` | 单次回答超时 |

## Docker Compose（补充路径）

```powershell
docker compose up --build
```

Compose 默认不启用 Ollama，绑定 `127.0.0.1:8770` 并把 SQLite 文件保存在命名卷中。若需连接宿主机 Ollama，可设置：

```powershell
$env:ENABLE_OLLAMA="1"
$env:OLLAMA_BASE_URL="http://host.docker.internal:11434"
docker compose up --build
```

## 故障排查

- **页面拒绝连接**：确认 `netstat -ano | Select-String ':8770'` 有监听进程。
- **端口占用**：设置 `SERVICEPILOT_PORT` 为其他本地端口。
- **模型离线**：页面会显示“确定性降级模式”，核心流程仍可使用。
- **版本冲突**：刷新队列，使用最新工单版本重新提交状态。
- **清空演示数据**：停止服务后删除 `data/tickets.db`；该操作不会删除源码或知识库。
