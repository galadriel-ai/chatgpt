function format {
  ruff format server && ruff format database
}

function unit-test {
  python -m pytest tests
}
