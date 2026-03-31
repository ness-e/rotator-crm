import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Integration Tests', () => {
    let testUser;

    beforeAll(async () => {
        // Create a test user
        testUser = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                password: 'testPassword123',
                firstName: 'Test',
                lastName: 'User',
                role: 'MEMBER',
                country: 'US'
            }
        });
    });

    afterAll(async () => {
        // Clean up test user
        if (testUser) {
            await prisma.user.delete({
                where: { id: testUser.id }
            });
        }
        await prisma.$disconnect();
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'testPassword123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('refreshToken');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongPassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject non-existent user', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'somePassword'
                });

            expect(response.status).toBe(401);
        });

        it('should reject missing email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    password: 'testPassword123'
                });

            expect(response.status).toBe(400);
        });

        it('should reject missing password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/forgot-password', () => {
        it('should accept valid email', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({
                    email: testUser.email
                });

            // Should return 200 even if email doesn't exist (security best practice)
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ok', true);
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({
                    email: 'invalid-email'
                });

            expect(response.status).toBe(400);
        });
    });
});
