# Bruno's IMS — M0 Aligned Build

This repo is aligned with:

- `OPENAPI.yaml` (API contract)
- `COPILOT_INSTRUCTIONS.md`
- `IMS_SPEC.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `ROADMAP.md`
- `BACKLOG.csv`

It exposes the **M0 API surface** and minimal frontend so Copilot can continue building autonomously.

## Quick start

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up --build
```

- Web:      http://localhost
- API base: http://localhost/api
