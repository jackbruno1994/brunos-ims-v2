import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Auth endpoints (stub)
app.post('/api/auth/login', (req: Request, res: Response) => {
  res.json({ token: 'stub_token', user: { id: 1, email: 'user@example.com' } });
});

// POS - Tables
app.get('/api/pos/tables', async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({ include: { outlet: true } });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.post('/api/pos/tables', async (req: Request, res: Response) => {
  try {
    const { outletId, number, capacity, status } = req.body;
    const table = await prisma.table.create({
      data: { outletId, number, capacity, status: status || 'AVAILABLE' }
    });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// POS - Orders
app.get('/api/pos/orders', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        table: true,
        orderItems: { include: { recipe: true } },
        payments: true
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/pos/orders', async (req: Request, res: Response) => {
  try {
    const { tableId, orderItems } = req.body;
    
    const order = await prisma.order.create({
      data: {
        tableId,
        status: 'DRAFT',
        total: 0,
        orderItems: {
          create: orderItems.map((item: any) => ({
            recipeId: item.recipeId,
            qty: item.qty,
            price: item.price
          }))
        }
      },
      include: {
        orderItems: { include: { recipe: true } }
      }
    });
    
    // Calculate total
    const total = order.orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { total },
      include: {
        orderItems: { include: { recipe: true } }
      }
    });
    
    res.status(201).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/pos/orders/:orderId/send', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SENT' },
      include: {
        orderItems: { include: { recipe: true } }
      }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send order' });
  }
});

// POS - Pay Order (Main feature implementation)
app.post('/api/pos/orders/:orderId/pay', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { amount, method } = req.body;
    
    // Validate order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            recipe: {
              include: {
                recipeItems: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          }
        },
        payments: true
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status === 'PAID') {
      return res.status(400).json({ error: 'Order already paid' });
    }
    
    // Use transaction to create Payment and StockMoves atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount: amount || order.total,
          method: method || 'CASH'
        }
      });
      
      // Calculate ingredient deductions
      // Aggregate by ingredientId to avoid duplicate StockMoves
      const ingredientDeductions = new Map<number, { ingredientId: number, totalQty: number }>();
      
      for (const orderItem of order.orderItems) {
        for (const recipeItem of orderItem.recipe.recipeItems) {
          const ingredientId = recipeItem.ingredientId;
          const qtyToDeduct = recipeItem.qty * orderItem.qty;
          
          if (ingredientDeductions.has(ingredientId)) {
            const existing = ingredientDeductions.get(ingredientId)!;
            existing.totalQty += qtyToDeduct;
          } else {
            ingredientDeductions.set(ingredientId, {
              ingredientId,
              totalQty: qtyToDeduct
            });
          }
        }
      }
      
      // Create StockMove entries
      const stockMoves = [];
      for (const deduction of ingredientDeductions.values()) {
        const stockMove = await tx.stockMove.create({
          data: {
            ingredientId: deduction.ingredientId,
            type: 'SALE',
            qty: -deduction.totalQty, // Negative to indicate deduction
            reason: 'SALE',
            refType: 'ORDER',
            refId: orderId
          },
          include: {
            ingredient: true
          }
        });
        stockMoves.push(stockMove);
      }
      
      // Update order status to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
        include: {
          orderItems: { include: { recipe: true } },
          payments: true
        }
      });
      
      return {
        payment,
        stockMoves,
        order: updatedOrder
      };
    });
    
    res.json({
      success: true,
      payment: result.payment,
      stockMovesCreated: result.stockMoves.length,
      stockMoves: result.stockMoves,
      order: result.order
    });
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// KDS - Tickets
app.get('/api/kds/tickets', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'SENT' },
      include: {
        table: true,
        orderItems: { include: { recipe: true } }
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Recipes
app.get('/api/recipes', async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        recipeItems: {
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

app.post('/api/recipes', async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, recipeItems } = req.body;
    const recipe = await prisma.recipe.create({
      data: {
        name,
        description,
        price,
        category,
        recipeItems: {
          create: recipeItems?.map((item: any) => ({
            ingredientId: item.ingredientId,
            qty: item.qty
          })) || []
        }
      },
      include: {
        recipeItems: {
          include: {
            ingredient: true
          }
        }
      }
    });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Inventory - Ingredients
app.get('/api/inventory/ingredients', async (req: Request, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany();
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

app.post('/api/inventory/ingredients', async (req: Request, res: Response) => {
  try {
    const { name, unit, costPerUnit } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: { name, unit, costPerUnit }
    });
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Inventory - StockMoves
app.get('/api/inventory/stock-moves', async (req: Request, res: Response) => {
  try {
    const stockMoves = await prisma.stockMove.findMany({
      include: {
        ingredient: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(stockMoves);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock moves' });
  }
});

app.post('/api/inventory/stock-moves', async (req: Request, res: Response) => {
  try {
    const { ingredientId, type, qty, reason, refType, refId } = req.body;
    const stockMove = await prisma.stockMove.create({
      data: {
        ingredientId,
        type,
        qty,
        reason,
        refType,
        refId
      },
      include: {
        ingredient: true
      }
    });
    res.status(201).json(stockMove);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock move' });
  }
});

// Procurement - Suppliers
app.get('/api/procurement/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/api/procurement/suppliers', async (req: Request, res: Response) => {
  try {
    const { name, contact, email } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, contact, email }
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Procurement - Purchase Orders
app.get('/api/procurement/pos', async (req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        purchaseOrderLines: true
      }
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/api/procurement/pos', async (req: Request, res: Response) => {
  try {
    const { supplierId, lines } = req.body;
    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        status: 'DRAFT',
        total: 0,
        purchaseOrderLines: {
          create: lines?.map((line: any) => ({
            ingredientId: line.ingredientId,
            qty: line.qty,
            unitPrice: line.unitPrice
          })) || []
        }
      },
      include: {
        supplier: true,
        purchaseOrderLines: true
      }
    });
    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Procurement - GRNs
app.post('/api/procurement/grns', async (req: Request, res: Response) => {
  try {
    const { purchaseOrderId, lines, notes } = req.body;
    const grn = await prisma.gRN.create({
      data: {
        purchaseOrderId,
        notes,
        grnLines: {
          create: lines?.map((line: any) => ({
            ingredientId: line.ingredientId,
            qtyReceived: line.qtyReceived
          })) || []
        }
      },
      include: {
        grnLines: true
      }
    });
    res.status(201).json(grn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create GRN' });
  }
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;
