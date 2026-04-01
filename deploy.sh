#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
git add -A
git commit -m "${1:-deploy}" || echo "Nothing to commit."
git push
