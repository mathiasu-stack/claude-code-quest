<#
    Claude Code Quest — offline static server (no-install fallback)

    Serves the game folder over loopback so the offline copy plays on a
    Windows machine with no Python installed. `Play Offline (Windows).bat`
    prefers save_server.py and only falls back to this.

    Deliberately read-only: PowerShell handles the game's static payload
    fine, but the Python server's /save (room editor) and /tts (neural
    narration) endpoints are not reimplemented here. Both answer 503, which
    the client already treats as "offline" — narration falls back to the
    browser's built-in voices, exactly as it does on the live site when
    Azure isn't configured.

    Binds 127.0.0.1 via a plain TCP socket: no admin rights, no HttpListener
    URL reservation, and no Windows Firewall prompt. Needs PowerShell 3+
    (every Windows since 8; Windows 7 with WMF3+).
#>

param(
  [int]$Port = 8899,
  [string]$Root
)

$ErrorActionPreference = 'Stop'

if (-not $Root) { $Root = $PSScriptRoot }
if (-not $Root) { $Root = (Get-Location).Path }
$Root = [System.IO.Path]::GetFullPath($Root).TrimEnd([System.IO.Path]::DirectorySeparatorChar)

if (-not (Test-Path -LiteralPath (Join-Path $Root 'index.html'))) {
  Write-Host ''
  Write-Host "  Can't find index.html in $Root"
  Write-Host '  This server must sit in the unzipped game folder.'
  Write-Host ''
  exit 1
}

$mime = @{
  '.html' = 'text/html; charset=utf-8';  '.htm'  = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8';   '.json' = 'application/json; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'; '.md'   = 'text/plain; charset=utf-8'
  '.svg'  = 'image/svg+xml';             '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg';                '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp';                '.gif'  = 'image/gif'
  '.ico'  = 'image/x-icon';              '.bmp'  = 'image/bmp'
  '.glb'  = 'model/gltf-binary';         '.gltf' = 'model/gltf+json'
  '.bin'  = 'application/octet-stream';  '.wasm' = 'application/wasm'
  '.mp3'  = 'audio/mpeg';                '.wav'  = 'audio/wav'
  '.ogg'  = 'audio/ogg';                 '.m4a'  = 'audio/mp4'
  '.woff' = 'font/woff';                 '.woff2'= 'font/woff2'
  '.ttf'  = 'font/ttf';                  '.otf'  = 'font/otf'
  '.map'  = 'application/json'
}

# Mirrors _BLOCKED_PREFIXES in save_server.py (lowercase, no leading slash).
$blocked = @(
  'save_server.py', 'save_server.ps1', 'offline_server.ps1', 'save.php',
  '.git', 'resume.md', 'claude.md', 'scripts/', 'logs', 'tts-cache',
  'tts_config.json'
)

$handlerScript = @'
param($client, $root, $mime, $blocked)

function Send-Simple($stream, $status, $body, $ctype) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $head  = "HTTP/1.1 $status`r`n" +
           "Content-Type: $ctype`r`n" +
           "Content-Length: $($bytes.Length)`r`n" +
           "Cache-Control: no-store`r`n" +
           "Connection: close`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
  $stream.Write($hb, 0, $hb.Length)
  if ($bytes.Length -gt 0) { $stream.Write($bytes, 0, $bytes.Length) }
  $stream.Flush()
}

$stream = $null
try {
  $client.NoDelay        = $true
  $client.ReceiveTimeout = 15000
  $client.SendTimeout    = 120000
  $stream = $client.GetStream()

  # ---- read the request head (browsers preconnect, so this may time out) --
  $buf = New-Object byte[] 4096
  $sb  = New-Object System.Text.StringBuilder
  $end = -1
  while ($true) {
    $n = $stream.Read($buf, 0, $buf.Length)
    if ($n -le 0) { return }
    [void]$sb.Append([System.Text.Encoding]::ASCII.GetString($buf, 0, $n))
    $end = $sb.ToString().IndexOf("`r`n`r`n")
    if ($end -ge 0) { break }
    if ($sb.Length -gt 16384) { return }
  }

  $lines = ($sb.ToString().Substring(0, $end)) -split "`r`n"
  $req   = $lines[0] -split ' '
  if ($req.Count -lt 2) { return }
  $method = $req[0].ToUpperInvariant()
  $target = $req[1]

  $headers = @{}
  if ($lines.Count -gt 1) {
    foreach ($line in $lines[1..($lines.Count - 1)]) {
      $c = $line.IndexOf(':')
      if ($c -gt 0) {
        $headers[$line.Substring(0, $c).Trim().ToLowerInvariant()] = $line.Substring($c + 1).Trim()
      }
    }
  }

  # ---- routing -----------------------------------------------------------
  if ($method -eq 'POST') {
    # /tts and /save are Python-server features; 503 is the client's
    # documented "fall back to local voices / editor unavailable" path.
    Send-Simple $stream '503 Service Unavailable' '{"ok":false,"error":"offline"}' 'application/json'
    return
  }
  if ($method -ne 'GET' -and $method -ne 'HEAD') {
    Send-Simple $stream '405 Method Not Allowed' 'Method not allowed' 'text/plain'
    return
  }

  $path = $target.Split('?')[0]
  try { $path = [System.Uri]::UnescapeDataString($path) } catch { }
  $rel = $path.TrimStart('/')
  if ($rel -eq '') { $rel = 'index.html' }

  $probe = $rel.ToLowerInvariant()
  foreach ($b in $blocked) {
    if ($probe.StartsWith($b)) {
      Send-Simple $stream '403 Forbidden' '{"ok":false,"error":"forbidden"}' 'application/json'
      return
    }
  }

  $full = ''
  $native = $rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
  try { $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $native)) } catch { }
  if (-not $full -or -not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    Send-Simple $stream '403 Forbidden' 'Forbidden' 'text/plain'
    return
  }
  if ([System.IO.Directory]::Exists($full)) { $full = [System.IO.Path]::Combine($full, 'index.html') }
  if (-not [System.IO.File]::Exists($full)) {
    Send-Simple $stream '404 Not Found' 'Not found' 'text/plain'
    return
  }

  $ext   = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
  $ctype = $mime[$ext]
  if (-not $ctype) { $ctype = 'application/octet-stream' }

  # ---- send the file, honouring a single Range (audio seeking) -----------
  $fs = [System.IO.File]::Open($full, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
  try {
    $total  = $fs.Length
    $start  = [int64]0
    $last   = $total - 1
    $status = '200 OK'

    $rangeHeader = $headers['range']
    if ($rangeHeader -and ($rangeHeader -match '^bytes=(\d*)-(\d*)$')) {
      $rs = $Matches[1]; $re = $Matches[2]
      if ($rs -ne '') {
        $start = [int64]$rs
        if ($re -ne '') { $last = [int64]$re }
      } elseif ($re -ne '') {
        $start = $total - [int64]$re
        if ($start -lt 0) { $start = [int64]0 }
      }
      if ($last -gt $total - 1) { $last = $total - 1 }
      if ($start -le $last) { $status = '206 Partial Content' }
      else { $start = [int64]0; $last = $total - 1 }
    }

    $len  = $last - $start + 1
    $head = "HTTP/1.1 $status`r`n" +
            "Content-Type: $ctype`r`n" +
            "Content-Length: $len`r`n" +
            "Accept-Ranges: bytes`r`n" +
            "Cache-Control: no-cache`r`n" +
            "Connection: close`r`n"
    if ($status -eq '206 Partial Content') { $head += "Content-Range: bytes $start-$last/$total`r`n" }
    $head += "`r`n"
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)

    if ($method -eq 'GET') {
      $fs.Position = $start
      $chunk = New-Object byte[] 65536
      $left  = $len
      while ($left -gt 0) {
        $want = [int][Math]::Min([int64]$chunk.Length, [int64]$left)
        $got  = $fs.Read($chunk, 0, $want)
        if ($got -le 0) { break }
        $stream.Write($chunk, 0, $got)
        $left -= $got
      }
    }
    $stream.Flush()
  } finally { $fs.Dispose() }
} catch {
  # A browser closing a connection mid-asset is normal; never kill the server.
} finally {
  if ($stream) { try { $stream.Close() } catch { } }
  try { $client.Close() } catch { }
}
'@

# ---- listen ---------------------------------------------------------------
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
try {
  $listener.Start()
} catch {
  Write-Host ''
  Write-Host "  Could not start on 127.0.0.1:$Port -> $($_.Exception.Message)"
  Write-Host '  If a copy is already running, use that window instead.'
  Write-Host ''
  exit 1
}

# Concurrency matters: browsers open several sockets at once and preconnect
# without sending a request, so a single-threaded accept loop would stall the
# whole page load behind one idle socket.
$pool = [runspacefactory]::CreateRunspacePool(1, 12)
$pool.Open()
$live = New-Object System.Collections.ArrayList

Write-Host "[offline_server] listening on 127.0.0.1:$Port | static root: $Root | read-only (no /save, no /tts)"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($handlerScript).AddArgument($client).AddArgument($Root).AddArgument($mime).AddArgument($blocked)
    [void]$live.Add([pscustomobject]@{ PS = $ps; Handle = $ps.BeginInvoke() })

    for ($i = $live.Count - 1; $i -ge 0; $i--) {
      if ($live[$i].Handle.IsCompleted) {
        try { [void]$live[$i].PS.EndInvoke($live[$i].Handle) } catch { }
        $live[$i].PS.Dispose()
        $live.RemoveAt($i)
      }
    }
  }
} finally {
  try { $listener.Stop() } catch { }
  try { $pool.Close() } catch { }
}
