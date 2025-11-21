import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Auth endpoints
app.post('/auth/login', (req: Request, res: Response) => {
  res.json({ 
    token: 'stub-token',
    user: { id: '1', email: 'user@example.com', name: 'Test User' }
  });
});

// POS - Outlets endpoints
app.get('/pos/outlets', async (req: Request, res: Response) => {
  try {
    const outlets = await prisma.outlet.findMany();
    res.json(outlets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outlets' });
  }
});

// POS - Tables endpoints
app.get('/pos/tables', async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      include: { outlet: true }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.post('/pos/tables', async (req: Request, res: Response) => {
  try {
    const { name, capacity, outletId } = req.body;
    const table = await prisma.table.create({
      data: { name, capacity: capacity || 4, outletId },
      include: { outlet: true }
    });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

app.get('/pos/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id },
      include: { outlet: true }
    });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

app.put('/pos/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, outletId } = req.body;
    const table = await prisma.table.update({
      where: { id },
      data: { name, capacity, outletId },
      include: { outlet: true }
    });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table' });
  }
});

app.delete('/pos/tables/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.table.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// POS - Orders endpoints
app.get('/pos/orders', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: { include: { recipe: true } },
        table: true,
        payments: true
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/pos/orders', async (req: Request, res: Response) => {
  try {
    const { tableId, items } = req.body;
    const order = await prisma.order.create({
      data: {
        tableId,
        status: 'pending',
        total: 0
      }
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/pos/orders/:orderId/send', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'sent' }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send order to KDS' });
  }
});

app.post('/pos/orders/:orderId/pay', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { amount, method } = req.body;
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: amount || 0,
        method: method || 'cash',
        status: 'completed'
      }
    });
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    });
    res.json({ payment, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// KDS endpoints
app.get('/kds/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.order.findMany({
      where: { status: 'sent' },
      include: {
        items: { include: { recipe: true } },
        table: true
      }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KDS tickets' });
  }
});

// Recipes endpoints
app.get('/recipes', async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: { items: { include: { ingredient: true } } }
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.post('/recipes', async (req: Request, res: Response) => {
  try {
    const { name, description, category, price } = req.body;
    const recipe = await prisma.recipe.create({
      data: { name, description, category, price: price || 0 }
    });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Inventory - Ingredients endpoints
app.get('/inventory/ingredients', async (req: Request, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany();
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

app.post('/inventory/ingredients', async (req: Request, res: Response) => {
  try {
    const { name, unit, stock, minStock } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: { name, unit: unit || 'kg', stock: stock || 0, minStock: minStock || 0 }
    });
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Inventory - Stock moves endpoint
app.post('/inventory/stock-moves', async (req: Request, res: Response) => {
  try {
    const { ingredientId, quantity, type, reference } = req.body;
    const stockMove = await prisma.stockMove.create({
      data: { ingredientId, quantity, type, reference }
    });
    res.status(201).json(stockMove);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock move' });
  }
});

// Procurement - Suppliers endpoints
app.get('/procurement/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/procurement/suppliers', async (req: Request, res: Response) => {
  try {
    const { name, contact, email, phone } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, contact, email, phone }
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Procurement - Purchase Orders endpoints
app.get('/procurement/pos', async (req: Request, res: Response) => {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, lines: true }
    });
    res.json(purchaseOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/procurement/pos', async (req: Request, res: Response) => {
  try {
    const { supplierId, status, total } = req.body;
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: { supplierId, status: status || 'draft', total: total || 0 }
    });
    res.status(201).json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Procurement - GRN endpoints
app.post('/procurement/grns', async (req: Request, res: Response) => {
  try {
    const { purchaseOrderId, status } = req.body;
    const grn = await prisma.gRN.create({
      data: { purchaseOrderId, status: status || 'pending' }
    });
    res.status(201).json(grn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create GRN' });
  }
});

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test mode
if (require.main === module) {
  main();
}

// Export app for testing
export { app, prisma };

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
