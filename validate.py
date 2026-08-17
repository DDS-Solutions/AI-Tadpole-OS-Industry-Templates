"""Backward-compatible entry point for the cross-repository contract validator."""

from scripts.validate_template import main


if __name__ == "__main__":
    raise SystemExit(main())
