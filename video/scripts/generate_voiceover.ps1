param(
  [int]$Rate = 0
)

$ErrorActionPreference = "Stop"
$videoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$segmentsPath = Join-Path $videoRoot "narration\segments.json"
$audioDir = Join-Path $videoRoot "public\audio"
$cacheDir = Join-Path ([IO.Path]::GetTempPath()) "servicepilot-voiceover"
$subtitlePath = Join-Path $videoRoot "subtitles\servicepilot-ai.zh-CN.srt"
$scriptPath = Join-Path $videoRoot "narration\voiceover.md"
$segments = Get-Content -LiteralPath $segmentsPath -Encoding UTF8 | ConvertFrom-Json

New-Item -ItemType Directory -Force -Path $audioDir, $cacheDir | Out-Null

function Format-SrtTime([double]$seconds) {
  $time = [TimeSpan]::FromMilliseconds([Math]::Round($seconds * 1000))
  return $time.ToString("hh\:mm\:ss\,fff")
}

$srt = New-Object System.Collections.Generic.List[string]
$markdown = New-Object System.Collections.Generic.List[string]
$markdown.Add("# ServicePilot AI 180s Chinese voice-over")
$markdown.Add("")
$markdown.Add("Offline voice: Microsoft Huihui Desktop. All business data is fictional demo data.")
$markdown.Add("")

for ($index = 0; $index -lt $segments.Count; $index++) {
  $number = $index + 1
  $name = "narration-{0:D2}" -f $number
  $rawPath = Join-Path $cacheDir "$name-raw.wav"
  $outputPath = Join-Path $audioDir "$name.wav"

  $speaker = New-Object -ComObject SAPI.SpVoice
  $tokens = $speaker.GetVoices()
  for ($voiceIndex = 0; $voiceIndex -lt $tokens.Count; $voiceIndex++) {
    $token = $tokens.Item($voiceIndex)
    if ($token.GetDescription() -like "*Huihui*") {
      $speaker.Voice = $token
      break
    }
  }
  $speaker.Rate = $Rate
  $speaker.Volume = 100
  $stream = New-Object -ComObject SAPI.SpFileStream
  $format = New-Object -ComObject SAPI.SpAudioFormat
  $format.Type = 22
  $stream.Format = $format
  $stream.Open($rawPath, 3, $false)
  $speaker.AudioOutputStream = $stream
  [void]$speaker.Speak([string]$segments[$index].text)
  $stream.Close()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($format)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($stream)
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($speaker)

  $rawDuration = [double](& ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $rawPath)
  $window = [double]$segments[$index].to - [double]$segments[$index].from - 0.2
  if ($rawDuration -gt $window) {
    $factor = $rawDuration / $window
    $factorText = $factor.ToString("0.0000", [Globalization.CultureInfo]::InvariantCulture)
    & ffmpeg -y -v error -i $rawPath -af "atempo=$factorText" -ar 48000 -ac 1 $outputPath
  } else {
    & ffmpeg -y -v error -i $rawPath -ar 48000 -ac 1 $outputPath
  }
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $name" }

  $srt.Add([string]$number)
  $srt.Add("$(Format-SrtTime $segments[$index].from) --> $(Format-SrtTime $segments[$index].to)")
  $srt.Add([string]$segments[$index].text)
  $srt.Add("")
  $markdown.Add("## $number | $(Format-SrtTime $segments[$index].from) - $(Format-SrtTime $segments[$index].to)")
  $markdown.Add("")
  $markdown.Add([string]$segments[$index].text)
  $markdown.Add("")
}

[IO.File]::WriteAllLines($subtitlePath, $srt, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllLines($scriptPath, $markdown, [Text.UTF8Encoding]::new($false))
Write-Host "Generated $($segments.Count) narration clips, SRT, and voice-over script."
