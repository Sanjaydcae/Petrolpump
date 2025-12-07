// Check Turso database contents
import { createClient } from '@libsql/client';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg';

async function checkData() {
    console.log('🔍 Checking Turso cloud database...\n');

    const client = createClient({
        url: TURSO_URL,
        authToken: TURSO_TOKEN,
    });

    try {
        // Check daily sheets
        const sheets = await client.execute('SELECT id, date, sales_person, pump_id, total_nozzle_sales FROM daily_sheets ORDER BY date DESC');
        console.log('📋 Daily Sheets:', sheets.rows.length);
        sheets.rows.forEach((row: any) => {
            const date = new Date(Number(row.date)).toISOString().split('T')[0];
            console.log(`   - ${date} | Pump ${row.pump_id} | ${row.sales_person} | ₹${row.total_nozzle_sales}`);
        });

        // Check credit sales
        const credits = await client.execute('SELECT id, date, customer_name, amount FROM credit_sales ORDER BY date DESC');
        console.log('\n💳 Credit Sales:', credits.rows.length);
        credits.rows.forEach((row: any) => {
            const date = new Date(Number(row.date)).toISOString().split('T')[0];
            console.log(`   - ${date} | ${row.customer_name} | ₹${row.amount}`);
        });

        // Check oil & lube sales
        const oils = await client.execute('SELECT id, date, product_name, quantity, total FROM oil_lube_sales ORDER BY date DESC');
        console.log('\n🛢️ Oil & Lube Sales:', oils.rows.length);
        oils.rows.forEach((row: any) => {
            const date = new Date(Number(row.date)).toISOString().split('T')[0];
            console.log(`   - ${date} | ${row.product_name} | Qty: ${row.quantity} | ₹${row.total}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkData();
