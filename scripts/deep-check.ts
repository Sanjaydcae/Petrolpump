import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function deepCheck() {
    console.log('🔍 Deep Database Check...\n');

    // List all tables
    console.log('📋 All Tables:');
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    tables.rows.forEach((t: any) => console.log(`  - ${t.name}`));

    // Check ALL oil_lube_sales
    console.log('\n🛢️ ALL Oil & Lube Sales (no limit):');
    const oils = await client.execute('SELECT * FROM oil_lube_sales ORDER BY id');
    console.log(`Total records: ${oils.rows.length}`);
    oils.rows.forEach((row: any) => {
        const date = new Date(Number(row.date)).toISOString().split('T')[0];
        console.log(`  ID: ${row.id} | ${date} | ${row.product_name} | Qty: ${row.quantity} | ₹${row.total} | Sheet: ${row.daily_sheet_id}`);
    });

    // Check daily_sheet_id references
    console.log('\n📊 Daily Sheet IDs in oil_lube_sales:');
    const sheetIds = await client.execute('SELECT DISTINCT daily_sheet_id FROM oil_lube_sales');
    sheetIds.rows.forEach((row: any) => console.log(`  - Sheet ID: ${row.daily_sheet_id}`));

    // Cross reference with daily_sheets
    console.log('\n📋 Associated Daily Sheets:');
    for (const row of sheetIds.rows) {
        const sheet = await client.execute({
            sql: 'SELECT id, date, pump_id FROM daily_sheets WHERE id = ?',
            args: [row.daily_sheet_id]
        });
        if (sheet.rows.length > 0) {
            const s = sheet.rows[0] as any;
            const date = new Date(Number(s.date)).toISOString().split('T')[0];
            console.log(`  Sheet ${s.id}: ${date} Pump ${s.pump_id}`);
        }
    }

    // Check for any orphaned or deleted records pattern
    console.log('\n🔢 Max IDs (to detect gaps from deletions):');
    const maxOil = await client.execute('SELECT MAX(id) as max_id, COUNT(*) as count FROM oil_lube_sales');
    console.log(`  oil_lube_sales: max_id=${(maxOil.rows[0] as any).max_id}, count=${(maxOil.rows[0] as any).count}`);

    const maxCredit = await client.execute('SELECT MAX(id) as max_id, COUNT(*) as count FROM credit_sales');
    console.log(`  credit_sales: max_id=${(maxCredit.rows[0] as any).max_id}, count=${(maxCredit.rows[0] as any).count}`);
}

deepCheck().catch(console.error);
