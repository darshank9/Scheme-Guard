import os
import sys

# Simulate the path addition from documents.py
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCHEME_GUARD_PATH = os.path.join(BASE_DIR, "Scheme-Guard", "scheme_guard")
sys.path.insert(0, SCHEME_GUARD_PATH)

print(f"DEBUG: BASE_DIR: {BASE_DIR}")
print(f"DEBUG: SCHEME_GUARD_PATH: {SCHEME_GUARD_PATH}")
print(f"DEBUG: sys.path[0]: {sys.path[0]}")

try:
    from appeal.appeal_generator import generate_appeal
    print("SUCCESS: Imported from appeal.appeal_generator")
except ImportError as e:
    print(f"FAILED: appeal.appeal_generator import failed: {e}")
    try:
        from scheme_guard.appeal.appeal_generator import generate_appeal
        print("SUCCESS: Imported from scheme_guard.appeal.appeal_generator")
    except ImportError as e2:
        print(f"FAILED: scheme_guard.appeal.appeal_generator import failed: {e2}")

print("Import Test Complete.")
