# UKSOCOM Lionheart Company — Static Unit Website

A fully static, responsive website (HTML/CSS/JS) with a simple JSON data layer.

## Run locally
- Option A: Use any static server (recommended, because fetch() of JSON is blocked on file://)
  - Python: `python -m http.server 8080`
  - Then open: http://localhost:8080

## Host
- GitHub Pages: push this folder to a repo and enable Pages from the repository settings.
- Any static host works (Netlify, Cloudflare Pages, etc.).

## Edit content
All editable data is in `/data/*.json`:
- `unitInfo.json` – name, motto, timezone, standard op time, Discord placeholder, next op datetime
- `orbat.json` – nested ORBAT structure (id/name/type/leader/comms/description/tasks/children)
- `roster.json` – member records
- `squads.json` – squadId/name/specialty
- `loadouts.json` – per squadId loadouts with roles and item lists
- `opsUpcoming.json` / `opsPast.json` – operation records and AAR templates

No layout edits required for normal content changes.
