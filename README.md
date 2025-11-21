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

## Features Implemented

- ✅ **INV-001**: Inventory deduction on payment - automatic StockMove creation when orders are paid
- 🔄 POS: Basic order management
- 🔄 KDS: Kitchen ticket display
- 🔄 Recipes: Menu items with ingredients
- 🔄 Procurement: Suppliers and purchase orders

## Quick start

### With Docker (Recommended)

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up --build
```

- Web:      http://localhost
- API base: http://localhost/api

### Local Development

```bash
# Start PostgreSQL
docker compose up db -d

# API
cd apps/api
npm install
npm run prisma:migrate
npm run dev

# Web (in another terminal)
cd apps/web
npm install
npm run dev
```

## Testing

```bash
cd apps/api
npm install
npm test
```

All tests passing: 6/6 ✅

## Documentation

- [API Documentation](./apps/api/README.md)
- [OpenAPI Spec](./OPENAPI.yaml)
- [Architecture](./ARCHITECTURE.md)
- [Data Model](./DATA_MODEL.md)
