import { drizzle } from 'drizzle-orm/libsql';
import { createClient, Client } from '@libsql/client';
import * as schema from './schema';

// Lazy database client - only connect when needed (not at build time)
let client: Client | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getClient(): Client {
    if (!client) {
        const url = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        console.log('Turso URL configured:', url ? `${url.substring(0, 30)}...` : 'NOT SET');
        console.log('Turso Auth Token:', authToken ? 'SET' : 'NOT SET');

        if (!url) {
            throw new Error('TURSO_DATABASE_URL environment variable is not set');
        }
        client = createClient({
            url,
            authToken,
        });
    }
    return client;
}

export function getDb() {
    if (!dbInstance) {
        dbInstance = drizzle(getClient(), { schema });
    }
    return dbInstance;
}

// For compatibility with existing code
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_, prop) {
        return (getDb() as any)[prop];
    }
});

// Track if migrations have run
let migrationsRun = false;

// Auto-migration: Create tables and add columns if they don't exist
export async function runMigrations() {
    if (migrationsRun) return;

    try {
        const c = getClient();

        // Create daily_sheets table
        await c.execute(`
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
        await c.execute(`
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
        await c.execute(`
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
        await c.execute(`
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
        await c.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
        `);

        // Create tank_readings table
        await c.execute(`
            CREATE TABLE IF NOT EXISTS tank_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date INTEGER NOT NULL,
                tank TEXT NOT NULL,
                dip_reading REAL NOT NULL,
                liters REAL NOT NULL DEFAULT 0,
                recorded_by TEXT,
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
