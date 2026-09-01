$ErrorActionPreference = "Stop"
$appDir = $PSScriptRoot
Push-Location $appDir
try {
    python -m unittest discover -s tests -v
    python evaluate.py
    node --check web\app.js
    Write-Host "All ServicePilot checks passed."
} finally {
    Pop-Location
}
