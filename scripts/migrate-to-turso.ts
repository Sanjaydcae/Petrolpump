// Migration Script: Local SQLite to Turso Cloud
// Run with: npx tsx scripts/migrate-to-turso.ts

import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

const TURSO_URL = 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ5OTkyNzAsImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.dQB2U9dYLwu4VB7FZ4-75FaVNqfu-Q9WCW6YIpZXYnGjwdFI1PsnrLuPMywk34Nebx5wFBtvttxqgCuyp4cpBQ';

async function migrate() {
    console.log('🚀 Starting migration from local SQLite to Turso...\n');

    // Connect to local SQLite
    const localDb = new Database('sqlite.db');
    console.log('✅ Connected to local SQLite database');

    // Connect to Turso
    const tursoClient = createClient({
        url: TURSO_URL,
        authToken: TURSO_TOKEN,
    });
    console.log('✅ Connected to Turso cloud database\n');

    try {
        // 1. Migrate daily_sheets
        console.log('📋 Migrating daily_sheets...');
        const dailySheets = localDb.prepare('SELECT * FROM daily_sheets').all();
        console.log(`   Found ${dailySheets.length} daily sheets`);

        for (const sheet of dailySheets as any[]) {
            await tursoClient.execute({
                sql: `INSERT INTO daily_sheets (id, date, sales_person, pump_id, total_nozzle_sales, total_credit_sales, total_oil_lube, paytm_amount, card_amount, fleat_card_amount, credit_amount, night_cash_amount, total_to_bank, is_approved, approved_by, approved_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    sheet.id, sheet.date, sheet.sales_person, sheet.pump_id,
                    sheet.total_nozzle_sales, sheet.total_credit_sales, sheet.total_oil_lube,
                    sheet.paytm_amount, sheet.card_amount, sheet.fleat_card_amount,
                    sheet.credit_amount, sheet.night_cash_amount, sheet.total_to_bank,
                    sheet.is_approved || 0, sheet.approved_by, sheet.approved_at
                ]
            });
        }
        console.log('   ✅ Daily sheets migrated\n');

        // 2. Migrate sales
        console.log('📋 Migrating sales...');
        const sales = localDb.prepare('SELECT * FROM sales').all();
        console.log(`   Found ${sales.length} sales records`);

        for (const sale of sales as any[]) {
            await tursoClient.execute({
                sql: `INSERT INTO sales (id, daily_sheet_id, date, sales_person, nozzle, product, open_reading, close_reading, testing, total_sale, rate, total_amount) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    sale.id, sale.daily_sheet_id, sale.date, sale.sales_person,
                    sale.nozzle, sale.product, sale.open_reading, sale.close_reading,
                    sale.testing, sale.total_sale, sale.rate, sale.total_amount
                ]
            });
        }
        console.log('   ✅ Sales migrated\n');

        // 3. Migrate credit_sales
        console.log('📋 Migrating credit_sales...');
        const creditSales = localDb.prepare('SELECT * FROM credit_sales').all();
        console.log(`   Found ${creditSales.length} credit sales records`);

        for (const credit of creditSales as any[]) {
            await tursoClient.execute({
                sql: `INSERT INTO credit_sales (id, daily_sheet_id, date, customer_name, amount, payment_method) 
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                    credit.id, credit.daily_sheet_id, credit.date,
                    credit.customer_name, credit.amount, credit.payment_method
                ]
            });
        }
        console.log('   ✅ Credit sales migrated\n');

        // 4. Migrate oil_lube_sales
        console.log('📋 Migrating oil_lube_sales...');
        const oilLubeSales = localDb.prepare('SELECT * FROM oil_lube_sales').all();
        console.log(`   Found ${oilLubeSales.length} oil & lube sales records`);

        for (const oil of oilLubeSales as any[]) {
            await tursoClient.execute({
                sql: `INSERT INTO oil_lube_sales (id, daily_sheet_id, date, product_name, quantity, price, total) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    oil.id, oil.daily_sheet_id, oil.date,
                    oil.product_name, oil.quantity, oil.price, oil.total
                ]
            });
        }
        console.log('   ✅ Oil & lube sales migrated\n');

        // 5. Migrate users (skip if already exists)
        console.log('📋 Migrating users...');
        const users = localDb.prepare('SELECT * FROM users').all();
        console.log(`   Found ${users.length} users`);

        for (const user of users as any[]) {
            try {
                await tursoClient.execute({
                    sql: `INSERT INTO users (id, username, password, role, created_at) 
                          VALUES (?, ?, ?, ?, ?)`,
                    args: [user.id, user.username, user.password, user.role, user.created_at]
                });
            } catch (e: any) {
                if (e.message?.includes('UNIQUE constraint')) {
                    console.log(`   ⚠️ User '${user.username}' already exists, skipping`);
                } else {
                    throw e;
                }
            }
        }
        console.log('   ✅ Users migrated\n');

        console.log('🎉 Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Daily Sheets: ${dailySheets.length}`);
        console.log(`   - Sales: ${sales.length}`);
        console.log(`   - Credit Sales: ${creditSales.length}`);
        console.log(`   - Oil & Lube Sales: ${oilLubeSales.length}`);
        console.log(`   - Users: ${users.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        localDb.close();
    }
}

migrate();
