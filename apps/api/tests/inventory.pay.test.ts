import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/index';

const prisma = new PrismaClient();

describe('POST /api/pos/orders/:orderId/pay - Inventory deduction on payment', () => {
  let outlet: any;
  let table: any;
  let ingredient1: any;
  let ingredient2: any;
  let recipe: any;
  let order: any;

  beforeAll(async () => {
    // Clean up database
    await prisma.stockMove.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.recipeItem.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.table.deleteMany();
    await prisma.outlet.deleteMany();
  });

  beforeEach(async () => {
    // Seed minimal test data
    
    // Create outlet and table
    outlet = await prisma.outlet.create({
      data: {
        name: 'Test Outlet',
        address: '123 Test St'
      }
    });

    table = await prisma.table.create({
      data: {
        outletId: outlet.id,
        number: 'T1',
        capacity: 4,
        status: 'AVAILABLE'
      }
    });

    // Create ingredients
    ingredient1 = await prisma.ingredient.create({
      data: {
        name: 'Flour',
        unit: 'kg',
        costPerUnit: 2.5
      }
    });

    ingredient2 = await prisma.ingredient.create({
      data: {
        name: 'Sugar',
        unit: 'kg',
        costPerUnit: 1.8
      }
    });

    // Create recipe with recipe items
    recipe = await prisma.recipe.create({
      data: {
        name: 'Test Cake',
        description: 'A delicious test cake',
        price: 15.0,
        category: 'Desserts',
        recipeItems: {
          create: [
            {
              ingredientId: ingredient1.id,
              qty: 0.5 // 0.5 kg flour per cake
            },
            {
              ingredientId: ingredient2.id,
              qty: 0.3 // 0.3 kg sugar per cake
            }
          ]
        }
      },
      include: {
        recipeItems: true
      }
    });

    // Create order with order items
    order = await prisma.order.create({
      data: {
        tableId: table.id,
        status: 'SENT',
        total: 30.0,
        orderItems: {
          create: [
            {
              recipeId: recipe.id,
              qty: 2, // Order 2 cakes
              price: 15.0
            }
          ]
        }
      },
      include: {
        orderItems: true
      }
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.stockMove.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.recipeItem.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.table.deleteMany();
    await prisma.outlet.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create Payment and StockMove entries when order is paid', async () => {
    const response = await request(app)
      .post(`/api/pos/orders/${order.id}/pay`)
      .send({
        amount: 30.0,
        method: 'CASH'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.payment).toBeDefined();
    expect(response.body.payment.orderId).toBe(order.id);
    expect(response.body.payment.amount).toBe(30.0);
    expect(response.body.payment.method).toBe('CASH');
    expect(response.body.stockMovesCreated).toBe(2); // 2 ingredients
    expect(response.body.order.status).toBe('PAID');

    // Verify StockMove entries were created
    const stockMoves = await prisma.stockMove.findMany({
      where: {
        refType: 'ORDER',
        refId: order.id
      },
      include: {
        ingredient: true
      }
    });

    expect(stockMoves).toHaveLength(2);

    // Check flour deduction (0.5 kg per cake * 2 cakes = 1.0 kg)
    const flourMove = stockMoves.find(sm => sm.ingredientId === ingredient1.id);
    expect(flourMove).toBeDefined();
    expect(flourMove!.type).toBe('SALE');
    expect(flourMove!.qty).toBe(-1.0); // Negative to indicate deduction
    expect(flourMove!.reason).toBe('SALE');
    expect(flourMove!.refType).toBe('ORDER');
    expect(flourMove!.refId).toBe(order.id);

    // Check sugar deduction (0.3 kg per cake * 2 cakes = 0.6 kg)
    const sugarMove = stockMoves.find(sm => sm.ingredientId === ingredient2.id);
    expect(sugarMove).toBeDefined();
    expect(sugarMove!.type).toBe('SALE');
    expect(sugarMove!.qty).toBe(-0.6); // Negative to indicate deduction
    expect(sugarMove!.reason).toBe('SALE');
    expect(sugarMove!.refType).toBe('ORDER');
    expect(sugarMove!.refId).toBe(order.id);
  });

  it('should aggregate ingredients when multiple order items use same ingredient', async () => {
    // Create a second recipe using the same ingredients
    const recipe2 = await prisma.recipe.create({
      data: {
        name: 'Test Bread',
        price: 8.0,
        recipeItems: {
          create: [
            {
              ingredientId: ingredient1.id,
              qty: 0.3 // 0.3 kg flour per bread
            }
          ]
        }
      }
    });

    // Add second order item to the order
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        recipeId: recipe2.id,
        qty: 1, // Order 1 bread
        price: 8.0
      }
    });

    const response = await request(app)
      .post(`/api/pos/orders/${order.id}/pay`)
      .send({
        amount: 38.0,
        method: 'CARD'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify StockMove entries - should still be 2 (flour and sugar aggregated)
    const stockMoves = await prisma.stockMove.findMany({
      where: {
        refType: 'ORDER',
        refId: order.id
      }
    });

    expect(stockMoves).toHaveLength(2);

    // Check aggregated flour deduction
    // Cake: 0.5 kg * 2 = 1.0 kg
    // Bread: 0.3 kg * 1 = 0.3 kg
    // Total: 1.3 kg
    const flourMove = stockMoves.find(sm => sm.ingredientId === ingredient1.id);
    expect(flourMove).toBeDefined();
    expect(flourMove!.qty).toBe(-1.3);

    // Check sugar deduction (only from cake)
    const sugarMove = stockMoves.find(sm => sm.ingredientId === ingredient2.id);
    expect(sugarMove).toBeDefined();
    expect(sugarMove!.qty).toBe(-0.6);
  });

  it('should return 404 if order does not exist', async () => {
    const response = await request(app)
      .post('/api/pos/orders/99999/pay')
      .send({
        amount: 30.0,
        method: 'CASH'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Order not found');
  });

  it('should return 400 if order is already paid', async () => {
    // Pay the order first time
    await request(app)
      .post(`/api/pos/orders/${order.id}/pay`)
      .send({
        amount: 30.0,
        method: 'CASH'
      });

    // Try to pay again
    const response = await request(app)
      .post(`/api/pos/orders/${order.id}/pay`)
      .send({
        amount: 30.0,
        method: 'CASH'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Order already paid');
  });

  it('should use order total if amount not provided', async () => {
    const response = await request(app)
      .post(`/api/pos/orders/${order.id}/pay`)
      .send({
        method: 'CASH'
      });

    expect(response.status).toBe(200);
    expect(response.body.payment.amount).toBe(order.total);
  });

  it('should use default payment method if not provided', async () => {
    const response = await request(app)
      .post(`/api/pos/orders/${order.id}/pay`)
      .send({
        amount: 30.0
      });

    expect(response.status).toBe(200);
    expect(response.body.payment.method).toBe('CASH');
  });
});
