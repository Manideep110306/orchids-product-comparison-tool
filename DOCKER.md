# Docker Deployment

This project can run in Docker without changing the existing local development flow.

## Services

- `frontend`: Builds the Vite app and serves it with Nginx on port `8080`
- `backend`: Runs the Express API on port `5000`

## Start

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- Backend health check: `http://localhost:5000/api/health`

## Environment

The compose file uses safe defaults so the stack can start without extra setup.

- `USE_MOCK=true` by default for demo data
- Set `SERPAPI_KEY` if you want real shopping results

Example:

```bash
SERPAPI_KEY=your_key_here docker compose up --build
```

## Notes

- Your normal local setup is unchanged; Docker support is additive only.
- The frontend proxies `/api` requests to the backend container through Nginx.
