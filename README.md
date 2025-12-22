## NFL Fantasy Analytics Backend — Data Foundation

This repo ingests NFL play-by-play (via `nfl_data_py` / nflfastR), optionally scrapes supplemental Pro Football Reference (best effort), stores everything in SQLite, and computes foundational usage/efficiency metrics for fantasy analysis.

### Setup

Create a virtualenv, install deps, and set environment variables:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp config/env.example .env  # optional (if your env supports dotfiles)
```

### Run

```bash
python main.py
```

### Tests

```bash
pytest
```

### Notes

- The PFR scraper is **best-effort** and will **never fabricate data**. If `games.pfr_boxscore_url` is empty, scraping is skipped.
- Missing route/snap fields are expected; downstream metrics will be `NULL` where inputs are missing.


