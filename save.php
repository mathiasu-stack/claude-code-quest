<?php
// save.php — write endpoint for the in-game editor's "💾 Save Permanently"
// button. Lives next to index.html so a relative POST to /save.php works on
// any Web Station deployment.
//
// Protocol: POST application/json
//   { "passcode": "<admin>", "files": [ { "name": "rooms.js", "content": "…" }, … ] }
//
// Hard restrictions:
//   • only POST,
//   • only filenames in the allow-list below,
//   • only writes inside ./data/ (a sibling of this file),
//   • passcode must match the SAVE_PASS constant exactly,
//   • content size capped to keep abusive payloads cheap.
//
// On success: { "ok": true, "written": ["data/rooms.js", …] }.
// On any failure: HTTP 4xx/5xx + { "ok": false, "error": "…" }.

declare(strict_types=1);

// Keep in sync with the admin passcode in app.js (the Kedash "Kapprim"
// flow). Hardcoded — this file lives in a private LAN/Tailscale-only
// deployment.
const SAVE_PASS = 'Kapprim';

// Only these basenames can be written. New override types need to be
// added here AND in the editor's _collectExportFiles().
const ALLOWED_FILES = [
  'rooms.js',
  'npc_overrides.js',
  'lesson_delivery_overrides.js',
  'compound_overrides.js',
];

const MAX_BYTES_PER_FILE = 1024 * 1024; // 1 MB ceiling per file

header('Content-Type: application/json');

function fail(int $status, string $msg): void {
  http_response_code($status);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  fail(405, 'POST only');
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') fail(400, 'empty body');

$payload = json_decode($raw, true);
if (!is_array($payload)) fail(400, 'body must be JSON object');

$pass = $payload['passcode'] ?? '';
if (!is_string($pass) || !hash_equals(SAVE_PASS, $pass)) {
  fail(403, 'invalid passcode');
}

$files = $payload['files'] ?? null;
if (!is_array($files) || !$files) fail(400, 'files array required');

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) fail(500, "data/ subdirectory not found at $dataDir");

$written = [];
foreach ($files as $f) {
  if (!is_array($f)) fail(400, 'each file entry must be an object');
  $name    = $f['name']    ?? '';
  $content = $f['content'] ?? '';
  if (!is_string($name) || !is_string($content)) {
    fail(400, 'file.name and file.content must be strings');
  }
  if (!in_array($name, ALLOWED_FILES, true)) {
    fail(403, "filename not allowed: $name");
  }
  if (strlen($content) > MAX_BYTES_PER_FILE) {
    fail(413, "file too large: $name");
  }
  // basename() defends against path traversal even though the allow-list
  // already restricts names — belt + suspenders.
  $target = $dataDir . DIRECTORY_SEPARATOR . basename($name);
  $bytes  = file_put_contents($target, $content);
  if ($bytes === false) fail(500, "failed to write $name");
  $written[] = "data/$name";
}

echo json_encode(['ok' => true, 'written' => $written]);
