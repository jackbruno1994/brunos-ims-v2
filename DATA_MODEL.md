# Bruno’s IMS — Data Model (M0 Snapshot)

This repo currently contains:
- User, Outlet, Table
- Ingredient
- Recipe, RecipeItem
- Order, OrderItem, Payment
- StockMove
- Supplier, PurchaseOrder, PurchaseOrderLine, GRN, GRNLine

See the full DATA_MODEL pack for the target model. Copilot should evolve Prisma schema to match that model over time (with migrations), keeping `OPENAPI.yaml` in sync.
