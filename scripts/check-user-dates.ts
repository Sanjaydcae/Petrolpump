import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function checkUserDates() {
    console.log('📅 Checking user timestamps...\n');

    const users = await client.execute('SELECT * FROM users');
    users.rows.forEach((row: any) => {
        const rawDate = Number(row.created_at);
        console.log(`User: ${row.username} (${row.role})`);
        console.log(`  Raw timestamp: ${rawDate}`);
        console.log(`  Digits: ${String(rawDate).length}`);
        console.log(`  As milliseconds: ${new Date(rawDate).toISOString()}`);
        console.log(`  As seconds (x1000): ${new Date(rawDate * 1000).toISOString()}`);
        console.log('');
    });
}

checkUserDates();
