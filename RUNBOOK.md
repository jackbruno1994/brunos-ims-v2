# Bruno's IMS - Infrastructure Runbook

## Quick Start (Local Development)

The fastest way to get started is running services locally without Docker:

### Prerequisites
- Node.js 20.x
- PostgreSQL 16
- npm or yarn

### Setup

1. **Start PostgreSQL:**
```bash
# Using Docker for PostgreSQL only
docker run -d \
  --name bruno-ims-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bruno_ims \
  -p 5432:5432 \
  postgres:16-alpine
```

2. **Setup API:**
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

3. **Setup Web:**
```bash
cd apps/web
npm install
npm run dev
```

4. **Access the application:**
- Web: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/health

## Docker Compose (Production-like)

### Setup

1. **Copy environment files:**
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. **Start all services:**
```bash
docker compose up --build
```

3. **Access through NGINX:**
- Web: http://localhost
- API: http://localhost/api
- Health: http://localhost/api/health

### Troubleshooting Docker Builds

If you encounter network timeout or permission issues during Docker build (especially with Alpine apk), try:

1. **Use Docker build with host network:**
```bash
docker compose build --network=host
```

2. **Build services individually:**
```bash
docker compose build db
docker compose build api
docker compose build web
docker compose build nginx
```

3. **Check Docker network:**
```bash
docker network ls
docker network inspect bridge
```

4. **Alternative: Use local development setup (above)**

### Common Docker Issues

**Issue: `apk` permission denied**
```
WARNING: fetching https://dl-cdn.alpinelinux.org/alpine/v3.22/main: Permission denied
```
**Solution:** This is a Docker network configuration issue. Use local development setup or configure Docker network settings.

**Issue: Database connection refused**
```
Error: Can't reach database server at `db:5432`
```
**Solution:** Wait for database to be fully ready. The API has a 10-second startup delay and will retry connections.

**Issue: Port already in use**
```
Error: bind: address already in use
```
**Solution:** Stop conflicting services or change ports in docker-compose.yml:
```yaml
ports:
  - "8080:80"   # Change 80 to 8080
  - "4001:4000" # Change 4000 to 4001
  - "3001:3000" # Change 3000 to 3001
```

## Service Architecture

```
┌─────────────────────────────────────────┐
│  NGINX Reverse Proxy                    │
│  Port: 80                                │
│  Routes:                                 │
│    /api/* → API Service                 │
│    /*     → Web Service                 │
└─────────────┬───────────────────────────┘
              │
         ┌────┴────┐
         │         │
    ┌────▼────┐ ┌─▼──────┐
    │   API   │ │  Web   │
    │ :4000   │ │ :3000  │
    │ Express │ │ Next.js│
    │ Prisma  │ │        │
    └────┬────┘ └────────┘
         │
    ┌────▼────────┐
    │ PostgreSQL  │
    │    :5432    │
    └─────────────┘
```

## Database Management

### Migrations

**Apply migrations:**
```bash
cd apps/api
npx prisma migrate deploy
```

**Create new migration:**
```bash
cd apps/api
npx prisma migrate dev --name description_of_changes
```

**Reset database (DANGER - deletes all data):**
```bash
cd apps/api
npx prisma migrate reset
```

### Prisma Studio (Database GUI)

```bash
cd apps/api
npx prisma studio
```
Opens at http://localhost:5555

### Direct Database Access

```bash
docker compose exec db psql -U postgres -d bruno_ims
```

## API Endpoints

### Health Check
```bash
curl http://localhost:4000/health
# or through NGINX:
curl http://localhost/api/health
```

### Authentication
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Create Table (POS)
```bash
curl -X POST http://localhost/api/pos/tables \
  -H "Content-Type: application/json" \
  -d '{"number":1,"seats":4,"outletId":"outlet-id-here"}'
```

### List Orders
```bash
curl http://localhost/api/pos/orders
```

## Monitoring

### View logs

**All services:**
```bash
docker compose logs -f
```

**Specific service:**
```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
docker compose logs -f nginx
```

### Check service health

```bash
docker compose ps
```

Should show all services as "healthy" or "running".

### Check database

```bash
docker compose exec db pg_isready -U postgres
```

## Testing

### Smoke Test Script

Create `test-api.sh`:
```bash
#!/bin/bash
set -e

echo "Testing API health..."
curl -f http://localhost/api/health

echo "\nTesting authentication..."
curl -f -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

echo "\nAll tests passed!"
```

```bash
chmod +x test-api.sh
./test-api.sh
```

## Deployment

### Environment Variables

**Production API (.env):**
```
DATABASE_URL="postgresql://username:password@host:5432/database"
PORT=4000
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
```

**Production Web (.env):**
```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
PORT=3000
```

### Security Checklist

- [ ] Change default database password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS (update nginx.conf)
- [ ] Set NODE_ENV=production
- [ ] Review CORS settings in API
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up log aggregation
- [ ] Configure backup strategy

### Docker Compose for Production

Consider using docker-compose.prod.yml:
```yaml
services:
  db:
    restart: always
    volumes:
      - db_data:/var/lib/postgresql/data
    # Don't expose port 5432 externally
  
  api:
    restart: always
    environment:
      NODE_ENV: production
  
  web:
    restart: always
    environment:
      NODE_ENV: production
  
  nginx:
    restart: always
    # Add SSL certificates
```

## Maintenance

### Backup Database

```bash
docker compose exec db pg_dump -U postgres bruno_ims > backup.sql
```

### Restore Database

```bash
docker compose exec -T db psql -U postgres bruno_ims < backup.sql
```

### Update Dependencies

```bash
cd apps/api
npm update
npm audit fix

cd apps/web
npm update
npm audit fix
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker compose up -d --build api

# Rebuild all services
docker compose up -d --build
```

### Clean Up

```bash
# Stop and remove containers
docker compose down

# Remove volumes (DANGER - deletes data)
docker compose down -v

# Remove unused Docker resources
docker system prune -a
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR:

1. Builds API and Web services
2. Runs TypeScript compilation
3. Builds Docker images
4. Reports status

### Manual CI Testing

```bash
# Install dependencies
cd apps/api && npm install
cd ../web && npm install

# Build
cd ../api && npm run build
cd ../web && npm run build

# Run locally
cd ../api && npm start &
cd ../web && npm start &
```

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Verify environment: `docker compose ps`
3. Test connectivity: `curl http://localhost/api/health`
4. Review configuration in this runbook
5. Check GitHub Issues

## Performance Tuning

### Database Connection Pooling

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10
  pool_timeout = 20
}
```

### NGINX Caching

Add to `infra/nginx/nginx.conf`:
```nginx
proxy_cache_path /tmp/cache levels=1:2 keys_zone=my_cache:10m max_size=1g;
proxy_cache my_cache;
```

### Node.js Memory

Update docker-compose.yml:
```yaml
api:
  environment:
    NODE_OPTIONS: "--max-old-space-size=4096"
```

## Quick Reference

| Service | Local | Docker | Through NGINX |
|---------|-------|--------|---------------|
| Web     | :3000 | :3000  | :80           |
| API     | :4000 | :4000  | :80/api       |
| DB      | :5432 | :5432  | N/A           |
| Health  | :4000/health | :4000/health | :80/api/health |
