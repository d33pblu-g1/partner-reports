#!/bin/sh
# Simple static server for local development
# Usage: ./serve.sh [port]

PORT=${1:-8000}

if command -v python3 >/dev/null 2>&1; then
  echo "Serving on http://localhost:$PORT (Ctrl+C to stop)"
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  echo "Serving on http://localhost:$PORT (Ctrl+C to stop)"
  python -m SimpleHTTPServer "$PORT"
else
  echo "Please install Python to run a quick local server."
  exit 1
fi


