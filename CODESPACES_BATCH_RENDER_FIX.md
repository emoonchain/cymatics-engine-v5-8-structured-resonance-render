# v5.5.1 Codespaces Batch Render Fix

This patch fixes batch render behavior in GitHub Codespaces.

## What changed

- Vite auto-start now uses `--host 0.0.0.0` instead of `127.0.0.1`
- Playwright still renders internally from `http://127.0.0.1:<port>`
- Added browser console/page error logging
- Added explicit canvas wait
- Added 120s timeout instead of silently hanging

## Important

The public Codespaces URL can show 404 if the server is not bound to `0.0.0.0`.
The batch renderer itself uses the internal URL, so the browser preview URL is only for you to inspect manually.

## Recommended test

```bash
rm -rf output
npm run generate:100
npm run animation:manifest
npm run animation:render:batch -- --limit 1
```

If you want to inspect the page manually:

```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

Then open the forwarded port from the Codespaces Ports panel.
