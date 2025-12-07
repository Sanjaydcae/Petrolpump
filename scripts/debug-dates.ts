import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function debug() {
    console.log('🔍 Detailed Debug Check...\n');

    try {
        // Get all daily sheets with raw timestamps
        const sheets = await client.execute('SELECT * FROM daily_sheets ORDER BY date DESC LIMIT 10');
        console.log('📋 Daily Sheets (raw):\n');
        sheets.rows.forEach((row: any) => {
            const rawDate = Number(row.date);
            const asDate = new Date(rawDate);
            console.log(`ID: ${row.id}, Pump: ${row.pump_id}`);
            console.log(`  Raw timestamp: ${rawDate}`);
            console.log(`  As Date: ${asDate.toISOString()}`);
            console.log(`  Total: ₹${row.total_nozzle_sales}`);
            console.log('');
        });

        // Test what a query for Dec 1 would look like
        console.log('\n📊 Query test for 2025-12-01:');
        const testDate = '2025-12-01';
        const startOfDay = new Date(testDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(testDate);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`  startOfDay: ${startOfDay.toISOString()} = ${startOfDay.getTime()}`);
        console.log(`  endOfDay: ${endOfDay.toISOString()} = ${endOfDay.getTime()}`);

        // Query with range
        const result = await client.execute({
            sql: 'SELECT * FROM daily_sheets WHERE date >= ? AND date <= ? AND pump_id = 1',
            args: [startOfDay.getTime(), endOfDay.getTime()]
        });
        console.log(`  Found ${result.rows.length} rows\n`);
        result.rows.forEach((row: any) => {
            console.log(`    -> ID: ${row.id}, date: ${new Date(Number(row.date)).toISOString()}, total: ₹${row.total_nozzle_sales}`);
        });

        // Check tank table schema
        console.log('\n🛢️ Tank table check:');
        try {
            const pragma = await client.execute("PRAGMA table_info(tank_readings)");
            console.log('Columns:', pragma.rows.map((r: any) => r.name).join(', '));
        } catch (e: any) {
            console.log('Tank table error:', e.message);
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

debug().catch(console.error);
