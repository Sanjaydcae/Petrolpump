import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Turso cloud database connection
const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:sqlite.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Track if migrations have run
let migrationsRun = false;

// Auto-migration: Create tables and add columns if they don't exist
export async function runMigrations() {
    if (migrationsRun) return;

    try {
        // Create daily_sheets table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS daily_sheets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date INTEGER NOT NULL,
                sales_person TEXT,
                pump_id INTEGER NOT NULL DEFAULT 1,
                total_nozzle_sales REAL NOT NULL DEFAULT 0,
                total_credit_sales REAL NOT NULL DEFAULT 0,
                total_oil_lube REAL NOT NULL DEFAULT 0,
                paytm_amount REAL NOT NULL DEFAULT 0,
                card_amount REAL NOT NULL DEFAULT 0,
                fleat_card_amount REAL NOT NULL DEFAULT 0,
                credit_amount REAL NOT NULL DEFAULT 0,
                night_cash_amount REAL NOT NULL DEFAULT 0,
                total_to_bank REAL NOT NULL DEFAULT 0,
                is_approved INTEGER DEFAULT 0,
                approved_by TEXT,
                approved_at INTEGER
            )
        `);

        // Create sales table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                daily_sheet_id INTEGER REFERENCES daily_sheets(id),
                date INTEGER NOT NULL,
                sales_person TEXT,
                nozzle TEXT NOT NULL,
                product TEXT NOT NULL,
                open_reading REAL NOT NULL,
                close_reading REAL NOT NULL,
                testing REAL NOT NULL DEFAULT 0,
                total_sale REAL NOT NULL,
                rate REAL NOT NULL,
                total_amount REAL NOT NULL
            )
        `);

        // Create credit_sales table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS credit_sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                daily_sheet_id INTEGER REFERENCES daily_sheets(id),
                date INTEGER NOT NULL,
                customer_name TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_method TEXT NOT NULL
            )
        `);

        // Create oil_lube_sales table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS oil_lube_sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                daily_sheet_id INTEGER REFERENCES daily_sheets(id),
                date INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                total REAL NOT NULL
            )
        `);

        // Create users table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
        `);

        migrationsRun = true;
        console.log('Database migrations completed');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}

// Initialize on first import (for local development)
runMigrations().catch(console.error);

