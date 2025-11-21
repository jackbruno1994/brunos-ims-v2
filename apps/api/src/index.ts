import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/auth/login', (req: Request, res: Response) => {
  // Stub implementation
  res.json({
    success: true,
    token: 'stub-jwt-token',
    user: {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'admin'
    }
  });
});

// POS - Tables
app.get('/pos/tables', async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        outlet: true
      }
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.post('/pos/tables', async (req: Request, res: Response) => {
  try {
    const { number, seats, outletId } = req.body;
    const table = await prisma.table.create({
      data: {
        number,
        seats: seats || 4,
        outletId
      }
    });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// POS - Orders
app.get('/pos/orders', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            recipe: true
          }
        },
        table: true,
        outlet: true
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/pos/orders', async (req: Request, res: Response) => {
  try {
    const { outletId, tableId } = req.body;
    const order = await prisma.order.create({
      data: {
        outletId,
        tableId,
        status: 'open'
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
    res.json({ success: true, order });
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
        amount,
        method: method || 'cash'
      }
    });
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    });
    
    res.json({ success: true, order, payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// KDS - Tickets
app.get('/kds/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.order.findMany({
      where: {
        status: 'sent'
      },
      include: {
        items: {
          include: {
            recipe: true
          }
        },
        table: true
      }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KDS tickets' });
  }
});

// Recipes
app.get('/recipes', async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.post('/recipes', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const recipe = await prisma.recipe.create({
      data: {
        name,
        description
      }
    });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Inventory - Ingredients
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
    const { name, unit, currentQty, minQty, cost } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        currentQty: currentQty || 0,
        minQty: minQty || 0,
        cost: cost || 0
      }
    });
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Inventory - Stock Moves
app.post('/inventory/stock-moves', async (req: Request, res: Response) => {
  try {
    const { ingredientId, quantity, type, reason, reference } = req.body;
    const stockMove = await prisma.stockMove.create({
      data: {
        ingredientId,
        quantity,
        type,
        reason,
        reference
      }
    });
    
    // Update ingredient quantity
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId }
    });
    
    if (ingredient) {
      let newQty = ingredient.currentQty;
      if (type === 'in') {
        newQty += quantity;
      } else if (type === 'out') {
        newQty -= quantity;
      } else if (type === 'adjustment') {
        newQty = quantity;
      }
      
      await prisma.ingredient.update({
        where: { id: ingredientId },
        data: { currentQty: newQty }
      });
    }
    
    res.status(201).json(stockMove);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock move' });
  }
});

// Procurement - Suppliers
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
      data: {
        name,
        contact,
        email,
        phone
      }
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Procurement - Purchase Orders
app.get('/procurement/pos', async (req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        lines: true
      }
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/procurement/pos', async (req: Request, res: Response) => {
  try {
    const { poNumber, supplierId } = req.body;
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: 'draft'
      }
    });
    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Procurement - GRNs
app.post('/procurement/grns', async (req: Request, res: Response) => {
  try {
    const { grnNumber, purchaseOrderId } = req.body;
    const grn = await prisma.gRN.create({
      data: {
        grnNumber,
        purchaseOrderId
      }
    });
    res.status(201).json(grn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create GRN' });
  }
});

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');
    
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
