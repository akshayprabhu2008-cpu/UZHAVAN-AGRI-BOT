# UZHAVAN BOT — 5-in-1 Solar-Hybrid Agribot Dashboard

A polished, responsive React + Tailwind CSS prototype for an agritech rover command center.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Prototype interactions

- Owner Console modal with mock owner/device details, autonomous/manual toggle, emergency motor stop, and PDF field-audit export.
- Simulated NPK, moisture, pH, ambient and solar telemetry with refresh animation.
- Acreage and module selection controls.
- 6.5-second mission simulation with live progress, estimated output counters, farmer savings and rolling activity log.
- Expandable project abstract and system architecture.

## Important prototype note

All telemetry, GPS coordinates, owner records, mission activity, performance values and savings are mock/demo data. The dashboard does not connect to real sensors, motors, GPS hardware, a cloud backend, or an actual autonomous robot. A production deployment needs authenticated APIs, hardware safety interlocks, signed device telemetry, role-based access, and validated agronomic calibration.


## Deploy to GitHub Pages

1. Create a public GitHub repository named `uzhavan-bot-dashboard`.
2. Upload the contents of this project (not the outer folder) to the repository's `main` branch.
3. In `vite.config.js`, make sure `base` matches the repository name, including leading and trailing slashes.
4. Open the repository's **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
5. Open the **Actions** tab and wait for the `Deploy UZHAVAN BOT to GitHub Pages` workflow to finish successfully.
6. Your site will be available at `https://YOUR-USERNAME.github.io/uzhavan-bot-dashboard/`.

If you use a different repository name, update the `base` value in `vite.config.js` before uploading.
