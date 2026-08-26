#!/usr/bin/env bash
# Double-click this file to play Claude Code Quest offline.
#
# Starts the local game server on this computer only (nothing leaves
# your machine) and opens it in your default browser. Your progress is
# saved in that browser via localStorage, tied to this launcher's port —
# always start the game from this file so your save is where you left it.

# The game itself lives in the claude-code-quest subfolder, so this launcher
# can sit alone at the top level.
cd "$(dirname "$0")" || exit 1
PORT=8899

# Keep the Terminal window readable if we bail out early.
die() {
  echo ""
  echo "  $1"
  echo ""
  read -r -p "Press Enter to close this window..."
  exit 1
}

if [ ! -d claude-code-quest ] || [ ! -f claude-code-quest/save_server.py ]; then
  die "Claude Code Quest can't find its game files.

  This launcher needs to sit next to the \"claude-code-quest\" folder that
  came with it. Unzip the whole download, keep the two together, and run
  the launcher from there.
  (Looked in: $PWD)"
fi
cd claude-code-quest || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  die "Claude Code Quest needs Python 3, which wasn't found on this computer.
  Install it from https://www.python.org/downloads/ and run this file again."
fi

port_is_open() {
  python3 -c "import socket,sys; s=socket.socket(); s.settimeout(1); sys.exit(0 if s.connect_ex(('127.0.0.1',$PORT))==0 else 1)" 2>/dev/null
}

# Catch a copy that's already running BEFORE starting a second server, so the
# duplicate can't bind-fail and leave this window claiming success while the
# older instance is the one actually answering on the port.
if port_is_open; then
  die "Claude Code Quest is already running in another window on port $PORT.
  Switch to that window (and its browser tab) instead of this one - your
  progress lives there. Close it first if you'd rather start fresh here."
fi

echo ""
echo "  Starting Claude Code Quest..."
python3 save_server.py "$PORT" 127.0.0.1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT

URL="http://localhost:$PORT/"

# Wait for the port to actually accept connections before opening the
# browser, so the first page load can't beat the server to it.
for _ in $(seq 1 30); do
  port_is_open && break
  kill -0 "$SERVER_PID" 2>/dev/null || break
  sleep 1
done

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  die "The game server stopped right after starting. The reason is printed above."
fi

if command -v open >/dev/null 2>&1; then
  open "$URL"            # macOS
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"        # Linux
fi

echo ""
echo "  Claude Code Quest is running at $URL"
echo "  If your browser didn't open by itself, go to that address."
echo ""
echo "  Keep this window open while you play. Close it (or press Ctrl+C) when you're done."
echo ""
wait "$SERVER_PID"
