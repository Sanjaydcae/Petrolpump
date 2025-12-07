// Restore original dates and verify data
import { createClient } from '@libsql/client';

const TURSO_URL = 'libsql://petrolpump-sanjaycae.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ5OTkyNzAsImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.dQB2U9dYLwu4VB7FZ4-75FaVNqfu-Q9WCW6YIpZXYnGjwdFI1PsnrLuPMywk34Nebx5wFBtvttxqgCuyp4cpBQ';

// Correct timestamps for Dec 2025 (in seconds - SQLite format)
const dateMapping: Record<number, number> = {
    1: 1733011200,  // 2024-12-01 -> Actually should be 2025-12-01 = 1764547200
    2: 1733011200,
    3: 1733097600,  // 2024-12-02
    4: 1733097600,
};

// Actually the original dates in seconds are correct for 2025:
// 1764547200 = 2025-12-01
// 1764633600 = 2025-12-02
// etc.

async function fixDates() {
    console.log('🔧 Restoring correct dates in Turso database...\n');

    const client = createClient({
        url: TURSO_URL,
        authToken: TURSO_TOKEN,
    });

    try {
        // Map to correct Unix timestamps in SECONDS (for SQLite timestamp mode)
        const correctDates: Record<number, number> = {
            1: 1764547200,   // 2025-12-01
            2: 1764547200,   // 2025-12-01
            3: 1764633600,   // 2025-12-02
            4: 1764633600,   // 2025-12-02
            5: 1764720000,   // 2025-12-03
            6: 1764720000,   // 2025-12-03
            7: 1764806400,   // 2025-12-04
            8: 1764806400,   // 2025-12-04
            9: 1764892800,   // 2025-12-05
            10: 1764892800,  // 2025-12-05
            11: 1764979200,  // 2025-12-06
            12: 1764979200,  // 2025-12-06
            13: 1765065600,  // 2025-12-07
            14: 1765065600,  // 2025-12-07
        };

        // But wait - SQLite with Drizzle uses milliseconds! Let's convert
        for (const [id, unixSeconds] of Object.entries(correctDates)) {
            const unixMs = unixSeconds * 1000; // Convert to milliseconds
            console.log(`Updating ID ${id} to ${new Date(unixMs).toISOString().split('T')[0]} (${unixMs})`);

            await client.execute({
                sql: 'UPDATE daily_sheets SET date = ? WHERE id = ?',
                args: [unixMs, Number(id)]
            });
        }

        // Update related tables
        console.log('\n📋 Updating related tables...');

        const sheets = await client.execute('SELECT id, date FROM daily_sheets');
        for (const sheet of sheets.rows as any[]) {
            await client.execute({
                sql: 'UPDATE sales SET date = ? WHERE daily_sheet_id = ?',
                args: [sheet.date, sheet.id]
            });
            await client.execute({
                sql: 'UPDATE credit_sales SET date = ? WHERE daily_sheet_id = ?',
                args: [sheet.date, sheet.id]
            });
            await client.execute({
                sql: 'UPDATE oil_lube_sales SET date = ? WHERE daily_sheet_id = ?',
                args: [sheet.date, sheet.id]
            });
        }

        console.log('\n✅ Dates fixed!');

        // Verify
        const verified = await client.execute('SELECT id, date, pump_id, sales_person FROM daily_sheets ORDER BY date, pump_id');
        console.log('\n📊 Verified Data:');
        verified.rows.forEach((row: any) => {
            const date = new Date(Number(row.date)).toISOString().split('T')[0];
            console.log(`   ID ${row.id}: ${date} | Pump ${row.pump_id} | ${row.sales_person}`);
        });

        // Check credits
        const credits = await client.execute('SELECT date, customer_name, amount FROM credit_sales');
        console.log('\n💳 Credit Sales:');
        credits.rows.forEach((row: any) => {
            const date = new Date(Number(row.date)).toISOString().split('T')[0];
            console.log(`   ${date} | ${row.customer_name} | ₹${row.amount}`);
        });

        // Check oil & lube
        const oils = await client.execute('SELECT date, product_name, quantity, total FROM oil_lube_sales');
        console.log('\n🛢️ Oil & Lube:');
        oils.rows.forEach((row: any) => {
            const date = new Date(Number(row.date)).toISOString().split('T')[0];
            console.log(`   ${date} | ${row.product_name} | Qty: ${row.quantity} | ₹${row.total}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixDates();
