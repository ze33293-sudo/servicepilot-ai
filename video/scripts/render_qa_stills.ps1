$ErrorActionPreference = "Stop"
$videoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$qaDir = Join-Path $videoRoot "out\qa"
New-Item -ItemType Directory -Force -Path $qaDir | Out-Null

$frames = @(
  130, 280, 390,
  520, 760, 1000, 1180,
  1400, 1580, 1880,
  2130, 2280, 2570, 3010,
  3270, 3420, 3740, 4070,
  4380, 4500, 4700, 4930, 5130, 5250, 5370
)

foreach ($frame in $frames) {
  $output = Join-Path $qaDir ("f{0:D4}.png" -f $frame)
  & npx.cmd remotion still src/index.ts ServicePilotDemo $output --frame=$frame --log=error
  if ($LASTEXITCODE -ne 0) { throw "Still render failed at frame $frame" }
}

Write-Host "Rendered $($frames.Count) QA stills to $qaDir"
