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
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start the entire stack
docker compose up --build
```

- Web:      http://localhost
- API base: http://localhost/api
- API health: http://localhost/api/health

## What's Included

### Services
- **PostgreSQL Database** (port 5432) - Data persistence
- **API Service** (port 4000) - Node/Express + Prisma backend
- **Web Service** (port 3000) - Next.js frontend
- **NGINX** (port 80) - Reverse proxy routing /api and web traffic

### API Endpoints (all from OPENAPI.yaml)

**Authentication:**
- `POST /api/auth/login` - User login

**POS (Point of Sale):**
- `GET /api/pos/tables` - List tables
- `POST /api/pos/tables` - Create table
- `GET /api/pos/orders` - List orders
- `POST /api/pos/orders` - Create order
- `POST /api/pos/orders/{orderId}/send` - Send to KDS
- `POST /api/pos/orders/{orderId}/pay` - Pay order

**KDS (Kitchen Display System):**
- `GET /api/kds/tickets` - List KDS tickets

**Recipes:**
- `GET /api/recipes` - List recipes
- `POST /api/recipes` - Create recipe

**Inventory:**
- `GET /api/inventory/ingredients` - List ingredients
- `POST /api/inventory/ingredients` - Create ingredient
- `POST /api/inventory/stock-moves` - Create stock move

**Procurement:**
- `GET /api/procurement/suppliers` - List suppliers
- `POST /api/procurement/suppliers` - Create supplier
- `GET /api/procurement/pos` - List purchase orders
- `POST /api/procurement/pos` - Create purchase order
- `POST /api/procurement/grns` - Create GRN

## Database Schema

The Prisma schema implements the M0 data model with:
- User, Outlet, Table
- Ingredient, Recipe, RecipeItem
- Order, OrderItem, Payment
- StockMove
- Supplier, PurchaseOrder, PurchaseOrderLine, GRN, GRNLine

Migrations run automatically on API startup.

## Development

### Local development without Docker

**API:**
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**Web:**
```bash
cd apps/web
npm install
npm run dev
```

### Environment Variables

**apps/api/.env:**
```
DATABASE_URL="postgresql://postgres:postgres@db:5432/bruno_ims"
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
```

**apps/web/.env:**
```
NEXT_PUBLIC_API_URL=http://localhost/api
PORT=3000
```

## Verification Steps

1. **Check all services are running:**
```bash
docker compose ps
```

2. **Check API health:**
```bash
curl http://localhost/api/health
```
Should return: `{"status":"ok"}`

3. **Test database connection:**
```bash
docker compose exec api npx prisma db push --skip-generate
```

4. **View logs:**
```bash
docker compose logs -f api
docker compose logs -f web
```

5. **Access the web interface:**
Open http://localhost in your browser. You should see the M0 landing page with system status showing API and Web as connected.

## Troubleshooting

**Port conflicts:**
If ports 80, 3000, 4000, or 5432 are in use, stop the conflicting services or modify `docker-compose.yml`.

**Docker network issues:**
If you encounter Alpine apk permission errors during build:
```
WARNING: fetching https://dl-cdn.alpinelinux.org/alpine/v3.22/main: Permission denied
```
This is a Docker network configuration issue. Use the local development setup instead:

```bash
# Start PostgreSQL only with Docker
docker run -d --name bruno-ims-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bruno_ims \
  -p 5432:5432 \
  postgres:16-alpine

# Run API locally
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev

# Run Web locally
cd apps/web
npm install
npm run dev
```

Then access:
- Web: http://localhost:3000
- API: http://localhost:4000

See [RUNBOOK.md](./RUNBOOK.md) for comprehensive deployment and troubleshooting guide.

**Database connection issues:**
The API waits for the database to be ready using a health check. If migrations fail, check logs:
```bash
docker compose logs db
docker compose logs api
```

**Build failures:**
Clear Docker cache and rebuild:
```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:
- Builds API and Web services
- Runs TypeScript compilation
- Builds Docker images

## Project Structure

```
.
├── apps/
│   ├── api/              # Node/Express API
│   │   ├── src/
│   │   │   └── index.ts  # Main API server with all routes
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── web/              # Next.js frontend
│       ├── src/
│       │   ├── pages/    # Next.js pages
│       │   └── styles/   # CSS styles
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       └── .env.example
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── wait-for-db.sh
│   └── nginx/
│       └── nginx.conf
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml
└── README.md
```

## Next Steps

This M0 build provides:
✅ Complete Docker-based stack  
✅ All OPENAPI.yaml endpoints implemented as stubs  
✅ Database schema with migrations  
✅ Health checks and proper service orchestration  
✅ CI/CD pipeline  

You can now:
1. Implement business logic in the API route handlers
2. Build out the frontend UI components
3. Add authentication and authorization
4. Expand test coverage
5. Deploy to staging/production environments
