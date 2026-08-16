"""
Vercel Serverless Function Entry Point for WorkMate Chennai FastAPI Backend
"""
import sys
import os
from pathlib import Path

_current_dir = Path(__file__).resolve().parent
_root_dir = _current_dir.parent
_backend_dir = _root_dir / "backend"

for p in [str(_root_dir), str(_backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app
