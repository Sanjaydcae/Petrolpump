import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function addLitersColumn() {
    console.log('Adding liters column to tank_readings...\n');

    try {
        await client.execute('ALTER TABLE tank_readings ADD COLUMN liters REAL NOT NULL DEFAULT 0');
        console.log('✅ Successfully added liters column!');
    } catch (e: any) {
        if (e.message.includes('duplicate column')) {
            console.log('✅ liters column already exists');
        } else {
            console.log('Error:', e.message);
        }
    }

    // Verify
    const pragma = await client.execute("PRAGMA table_info(tank_readings)");
    console.log('\n📋 tank_readings columns:');
    pragma.rows.forEach((r: any) => console.log(`  - ${r.name} (${r.type})`));
}

addLitersColumn();
