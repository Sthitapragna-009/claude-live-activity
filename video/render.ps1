# Pass -Fresh to re-render every chunk; otherwise finished chunks are kept (resume after a failure).
param([switch]$Fresh)
# Renders the film in chunks (a fresh Chrome per chunk avoids WebGL memory build-up),
# joins them, then lays the voiceover in at its 0.4 s offset.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$total = 1980; $chunk = 330
New-Item -ItemType Directory -Force out/chunks | Out-Null
if ($Fresh) { Remove-Item out/chunks/* -ErrorAction SilentlyContinue }
$list = @()
for ($s = 0; $s -lt $total; $s += $chunk) {
  $e = [Math]::Min($s + $chunk - 1, $total - 1)
  $f = "out/chunks/part_$s.mp4"
  $list += "file 'part_$s.mp4'"
  if (Test-Path $f) { Write-Host "Keeping $f"; continue }
  Write-Host "Rendering frames $s-$e"
  npx remotion render src/index.ts ClaudeLiveActivity $f --frames=$s-$e --codec h264 --crf 17 --gl=angle --concurrency=2 --muted --overwrite --log=error --timeout=120000
  if ($LASTEXITCODE -ne 0) { Remove-Item $f -ErrorAction SilentlyContinue; throw "Chunk $s-$e failed" }
}
$list | Set-Content -Encoding ascii out/chunks/list.txt
npx remotion ffmpeg -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/chunks/joined.mp4
npx remotion ffmpeg -y -i out/chunks/joined.mp4 -itsoffset 0.4 -i public/voiceover.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k out/claude-live-activity.mp4
Write-Host "Done: out/claude-live-activity.mp4"
