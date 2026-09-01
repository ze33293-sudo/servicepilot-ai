param(
    [switch]$EnableOllama
)

$ErrorActionPreference = "Stop"
$appDir = $PSScriptRoot
$workspaceRoot = Split-Path -Parent $appDir
$env:SERVICEPILOT_HOST = "127.0.0.1"
$env:SERVICEPILOT_PORT = "8770"
$env:OLLAMA_MODEL = "qwen3.5:9b"
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:OLLAMA_NO_CLOUD = "1"
$env:ENABLE_OLLAMA = if ($EnableOllama) { "1" } else { "0" }

function Test-ServicePilot {
    try {
        $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:8770/api/health")
        $request.Proxy = $null
        $request.Timeout = 2000
        $response = $request.GetResponse()
        $response.Close()
        return $true
    } catch { return $false }
}

function Test-Ollama {
    try {
        $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:11434/api/version")
        $request.Proxy = $null
        $request.Timeout = 2000
        $response = $request.GetResponse()
        $response.Close()
        return $true
    } catch { return $false }
}

if (Test-ServicePilot) {
    Write-Host "ServicePilot AI is already running: http://127.0.0.1:8770"
    exit 0
}

if ($EnableOllama -and -not (Test-Ollama)) {
    $ollamaExe = Join-Path $workspaceRoot ".local\ollama\ollama.exe"
    if (-not (Test-Path -LiteralPath $ollamaExe)) {
        throw "Ollama executable not found: $ollamaExe"
    }
    $env:OLLAMA_MODELS = Join-Path $workspaceRoot ".local\ollama-models"
    Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden | Out-Null
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-Ollama) { $ready = $true; break }
    }
    if (-not $ready) { throw "Local Ollama did not start within 15 seconds." }
}

python (Join-Path $appDir "app.py")
