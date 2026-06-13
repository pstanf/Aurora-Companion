# Extends sounds/528hz.mp3 to ~12 minutes by looping the source (requires ffmpeg).
# The app also crossfades short tracks during Rest, but a longer file sounds smoother.
#
# Install ffmpeg: winget install Gyan.FFmpeg
# Then from aurora-app:  .\scripts\extend-528hz.ps1

$ErrorActionPreference = 'Stop'
$appRoot = Split-Path $PSScriptRoot -Parent
$src = Join-Path $appRoot 'sounds\528hz.mp3'
$tmp = Join-Path $appRoot 'sounds\528hz.extended.mp3'
$bak = Join-Path $appRoot 'sounds\528hz.original.mp3'

if (-not (Test-Path $src)) { throw "Missing $src" }

$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue)?.Source
if (-not $ffmpeg) { throw 'ffmpeg not found. Install with: winget install Gyan.FFmpeg' }

Write-Host 'Building ~12 min 528hz track (4 loops)...'
& $ffmpeg -y -stream_loop 3 -i $src -c copy $tmp
if ($LASTEXITCODE -ne 0) { throw 'ffmpeg failed' }

if (-not (Test-Path $bak)) {
  Copy-Item $src $bak
  Write-Host 'Backed up original to sounds\528hz.original.mp3'
}
Move-Item -Force $tmp $src
Write-Host 'Done. Redeploy aurora-app to Netlify when ready.'
