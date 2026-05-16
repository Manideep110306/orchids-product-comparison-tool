# Docker Deployment

This project can run in Docker without changing the existing local development flow.

## Services

- `frontend`: Builds the Vite app and serves it with Nginx on port `80`
- `backend`: Runs the Express API on port `5000`

## Start

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- Backend health check: `http://localhost:5000/api/health`

Render service URLs:

- Frontend: `https://orchids-product-comparison-tool-1.onrender.com`
- Backend: `https://orchids-product-comparison-tool.onrender.com`

## Environment

Docker Compose reads backend runtime settings from `backend/.env`.

- Set `SERPAPI_KEY` in `backend/.env` for live shopping results
- Keep `USE_MOCK=false` in `backend/.env` if you want real multi-platform results
- Compose keeps fallback defaults only for non-sensitive limits and timeouts

Example:

```bash
docker compose up --build
```

## Notes

- Your normal local setup is unchanged; Docker support is additive only.
- The frontend proxies `/api` requests to the backend container through Nginx.
