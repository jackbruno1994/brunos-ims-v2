import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app, prisma } from '../src/index';

describe('Table CRUD API', () => {
  let testOutletId: string;

  beforeAll(async () => {
    // Create a test outlet for tables
    const outlet = await prisma.outlet.create({
      data: {
        name: 'Test Outlet',
        address: '123 Test Street',
      },
    });
    testOutletId = outlet.id;
  });

  afterAll(async () => {
    // Clean up: delete all test tables and outlets
    await prisma.table.deleteMany({});
    await prisma.outlet.deleteMany({});
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up tables after each test
    await prisma.table.deleteMany({});
  });

  describe('POST /pos/tables', () => {
    it('should create a new table', async () => {
      const response = await request(app)
        .post('/pos/tables')
        .send({
          name: 'Table 1',
          capacity: 4,
          outletId: testOutletId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Table 1');
      expect(response.body.capacity).toBe(4);
      expect(response.body.outletId).toBe(testOutletId);
      expect(response.body).toHaveProperty('outlet');
      expect(response.body.outlet.name).toBe('Test Outlet');
    });

    it('should create a table with default capacity', async () => {
      const response = await request(app)
        .post('/pos/tables')
        .send({
          name: 'Table 2',
          outletId: testOutletId,
        })
        .expect(201);

      expect(response.body.capacity).toBe(4);
    });
  });

  describe('GET /pos/tables', () => {
    it('should return an empty array when no tables exist', async () => {
      const response = await request(app)
        .get('/pos/tables')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all tables', async () => {
      // Create test tables
      await prisma.table.createMany({
        data: [
          { name: 'Table 1', capacity: 4, outletId: testOutletId },
          { name: 'Table 2', capacity: 6, outletId: testOutletId },
        ],
      });

      const response = await request(app)
        .get('/pos/tables')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('outlet');
    });
  });

  describe('GET /pos/tables/:id', () => {
    it('should return a table by id', async () => {
      const table = await prisma.table.create({
        data: {
          name: 'Table 1',
          capacity: 4,
          outletId: testOutletId,
        },
      });

      const response = await request(app)
        .get(`/pos/tables/${table.id}`)
        .expect(200);

      expect(response.body.id).toBe(table.id);
      expect(response.body.name).toBe('Table 1');
      expect(response.body).toHaveProperty('outlet');
    });

    it('should return 404 for non-existent table', async () => {
      const response = await request(app)
        .get('/pos/tables/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /pos/tables/:id', () => {
    it('should update a table', async () => {
      const table = await prisma.table.create({
        data: {
          name: 'Table 1',
          capacity: 4,
          outletId: testOutletId,
        },
      });

      const response = await request(app)
        .put(`/pos/tables/${table.id}`)
        .send({
          name: 'Table 1 Updated',
          capacity: 6,
          outletId: testOutletId,
        })
        .expect(200);

      expect(response.body.id).toBe(table.id);
      expect(response.body.name).toBe('Table 1 Updated');
      expect(response.body.capacity).toBe(6);

      // Verify in database
      const updatedTable = await prisma.table.findUnique({
        where: { id: table.id },
      });
      expect(updatedTable?.name).toBe('Table 1 Updated');
      expect(updatedTable?.capacity).toBe(6);
    });

    it('should return 500 for non-existent table', async () => {
      const response = await request(app)
        .put('/pos/tables/non-existent-id')
        .send({
          name: 'Table Updated',
          capacity: 6,
          outletId: testOutletId,
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /pos/tables/:id', () => {
    it('should delete a table', async () => {
      const table = await prisma.table.create({
        data: {
          name: 'Table 1',
          capacity: 4,
          outletId: testOutletId,
        },
      });

      await request(app)
        .delete(`/pos/tables/${table.id}`)
        .expect(204);

      // Verify deletion in database
      const deletedTable = await prisma.table.findUnique({
        where: { id: table.id },
      });
      expect(deletedTable).toBeNull();
    });

    it('should return 500 for non-existent table', async () => {
      const response = await request(app)
        .delete('/pos/tables/non-existent-id')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});
