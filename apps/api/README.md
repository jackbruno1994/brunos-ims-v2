# Bruno's IMS - API

Node.js Express API with Prisma ORM for Bruno's Inventory Management System.

## Features

- **POS**: Point of Sale - tables, orders, payments
- **KDS**: Kitchen Display System - ticket management
- **Recipes**: Menu items with ingredient tracking
- **Inventory**: Ingredients and stock movements
- **Procurement**: Suppliers, purchase orders, goods received notes

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Installation

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bruno_ims?schema=public"
PORT=4000
NODE_ENV=development
```

### Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Optional: Open Prisma Studio
npm run prisma:studio
```

## Development

```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Production mode
npm start
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (stub)

### POS
- `GET /api/pos/tables` - List tables
- `POST /api/pos/tables` - Create table
- `GET /api/pos/orders` - List orders
- `POST /api/pos/orders` - Create order
- `POST /api/pos/orders/:orderId/send` - Send to KDS
- `POST /api/pos/orders/:orderId/pay` - Pay order (creates StockMoves)

### KDS
- `GET /api/kds/tickets` - Get KDS tickets

### Recipes
- `GET /api/recipes` - List recipes
- `POST /api/recipes` - Create recipe

### Inventory
- `GET /api/inventory/ingredients` - List ingredients
- `POST /api/inventory/ingredients` - Create ingredient
- `GET /api/inventory/stock-moves` - List stock moves
- `POST /api/inventory/stock-moves` - Create stock move

### Procurement
- `GET /api/procurement/suppliers` - List suppliers
- `POST /api/procurement/suppliers` - Create supplier
- `GET /api/procurement/pos` - List purchase orders
- `POST /api/procurement/pos` - Create purchase order
- `POST /api/procurement/grns` - Create GRN

## Key Implementation: Payment with Inventory Deduction

When an order is paid via `POST /api/pos/orders/:orderId/pay`, the system:

1. Creates a Payment record
2. Calculates ingredient usage from order items and their recipes
3. Aggregates ingredients by ID to avoid duplicate stock moves
4. Creates StockMove entries with:
   - `type: "SALE"`
   - `qty: negative value` (e.g., -1.5 for 1.5 kg deduction)
   - `reason: "SALE"`
   - `refType: "ORDER"`
   - `refId: orderId`
5. Updates order status to "PAID"
6. All operations in a Prisma transaction for atomicity

### Example Request

```bash
curl -X POST http://localhost:4000/api/pos/orders/1/pay \
  -H "Content-Type: application/json" \
  -d '{"amount":30.0,"method":"CASH"}'
```

### Example Response

```json
{
  "success": true,
  "payment": {
    "id": 1,
    "orderId": 1,
    "amount": 30.0,
    "method": "CASH"
  },
  "stockMovesCreated": 2,
  "stockMoves": [
    {
      "id": 1,
      "ingredientId": 1,
      "type": "SALE",
      "qty": -1.0,
      "reason": "SALE",
      "refType": "ORDER",
      "refId": 1
    },
    {
      "id": 2,
      "ingredientId": 2,
      "type": "SALE",
      "qty": -0.6,
      "reason": "SALE",
      "refType": "ORDER",
      "refId": 1
    }
  ],
  "order": {
    "id": 1,
    "status": "PAID",
    ...
  }
}
```

## Architecture Decisions

### Polymorphic References
StockMove uses `refType` and `refId` without foreign key constraints to support references to multiple entity types (Order, PurchaseOrder, GRN).

### Stock Movement Convention
- Negative `qty` = deduction (SALE, WASTE)
- Positive `qty` = addition (PURCHASE, ADJUSTMENT)

### Transaction Pattern
All multi-record operations use Prisma transactions:

```typescript
await prisma.$transaction(async (tx) => {
  // Multiple operations here
});
```

## License

Proprietary - Bruno's IMS
