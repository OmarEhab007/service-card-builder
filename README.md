# Damee Service Card Builder

Damee Service Card Builder is a Vite-powered web app for creating and exporting service cards.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

Build the app for a sub-path deployment:

```bash
VITE_BASE_PATH=/service-card-builder/ npm run build
```

The output is generated in `dist/`.

## GitHub Pages Deployment

This project includes `.github/workflows/deploy-pages.yml` to deploy on pushes to `main`.

After creating the GitHub repository:

1. Go to **Settings -> Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` and wait for the workflow to finish.

## Domain Routing (`d3mee.com`)

To serve this app under:

`https://d3mee.com/service-card-builder/`

configure your reverse proxy (Nginx/Apache) to map that path to the deployed static assets or the Pages site.
