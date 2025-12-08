import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function fixUserTimestamps() {
    console.log('🔧 Fixing user timestamps (converting seconds to milliseconds)...\n');

    // Get all users
    const users = await client.execute('SELECT id, username, created_at FROM users');

    for (const user of users.rows) {
        const rawTimestamp = Number(user.created_at);
        const digits = String(rawTimestamp).length;

        // If it's 10 digits, it's in seconds - convert to milliseconds
        if (digits === 10) {
            const newTimestamp = rawTimestamp * 1000;
            console.log(`Updating ${user.username}: ${rawTimestamp} -> ${newTimestamp}`);
            console.log(`  Before: ${new Date(rawTimestamp).toISOString()}`);
            console.log(`  After:  ${new Date(newTimestamp).toISOString()}`);

            await client.execute({
                sql: 'UPDATE users SET created_at = ? WHERE id = ?',
                args: [newTimestamp, user.id]
            });
            console.log('  ✅ Updated!\n');
        } else if (digits === 13) {
            console.log(`Skipping ${user.username}: already in milliseconds`);
        } else {
            console.log(`⚠️ Unknown format for ${user.username}: ${rawTimestamp} (${digits} digits)`);
        }
    }

    console.log('✅ Done fixing user timestamps!');
}

fixUserTimestamps().catch(console.error);
