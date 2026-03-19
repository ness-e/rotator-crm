import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

async function testDatabase() {
    console.log('--- Testing Database Connectivity ---');
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully.');
        const userCount = await prisma.user.count();
        console.log(`✅ Table access verified (Found ${userCount} users).`);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

async function testServerStatus() {
    console.log('\n--- Testing Server Status ---');
    try {
        const response = await axios.get(`${BACKEND_URL}/health`);
        console.log(`✅ Health check: ${response.status} ${response.statusText}`);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️ Server not running at', BACKEND_URL, '(Normal if not running dev)');
        } else {
            console.error('❌ Server check failed:', error.message);
        }
    }
}

async function testAuthentication() {
    console.log('\n--- Testing Authentication ---');
    try {
        const credentials = {
            email: 'admin@rotatorsurvey.com',
            password: 'RotatorAdmin2026!'
        };
        console.log(`Testing login for: ${credentials.email}`);
        const response = await axios.post(`${BACKEND_URL}/api/auth/login`, credentials);
        if (response.data.token) {
            console.log('✅ Login successful (Received Token).');
            console.log(`✅ Role: ${response.data.role || 'Not returned'}`);
        } else {
            console.log('⚠️ Login response did not contain a token.');
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
             console.log('⚠️ Skip: Server offline at', BACKEND_URL);
        } else {
            const msg = error.response?.data?.error || error.response?.data?.message || error.message;
            console.error('❌ Authentication test failed:', msg);
        }
    }
}

async function main() {
    console.log('🚀 Starting System Integration Tests...\n');
    
    try {
        await testDatabase();
        await testServerStatus();
        await testAuthentication();
        
        console.log('\n✅ ALL CORE SYSTEM TESTS FINISHED.');
    } catch (error) {
        console.error('\n❌ INTEGRATION TESTS FAILED.');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
