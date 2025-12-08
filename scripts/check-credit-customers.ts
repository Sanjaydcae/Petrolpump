import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function checkCreditCustomers() {
    console.log('📋 Checking credit customers in database...\n');

    const credits = await client.execute('SELECT DISTINCT customer_name FROM credit_sales ORDER BY customer_name');

    console.log(`Found ${credits.rows.length} unique credit customers:\n`);
    credits.rows.forEach((row: any) => {
        console.log(`  - ${row.customer_name}`);
    });
}

checkCreditCustomers().catch(console.error);
