import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function fixTankReadingTimestamps() {
    console.log('🔧 Fixing tank reading timestamps (converting seconds to milliseconds)...\n');

    // Get all tank readings
    const readings = await client.execute('SELECT id, tank, date FROM tank_readings');

    let fixed = 0;
    let skipped = 0;

    for (const reading of readings.rows) {
        const rawTimestamp = Number(reading.date);
        const digits = String(rawTimestamp).length;

        // If it's 10 digits, it's in seconds - convert to milliseconds
        if (digits === 10) {
            const newTimestamp = rawTimestamp * 1000;
            console.log(`Updating tank reading #${reading.id} (${reading.tank}): ${rawTimestamp} -> ${newTimestamp}`);
            console.log(`  Before: ${new Date(rawTimestamp).toISOString()}`);
            console.log(`  After:  ${new Date(newTimestamp).toISOString()}`);

            await client.execute({
                sql: 'UPDATE tank_readings SET date = ? WHERE id = ?',
                args: [newTimestamp, reading.id]
            });
            console.log('  ✅ Updated!\n');
            fixed++;
        } else if (digits === 13) {
            console.log(`Skipping tank reading #${reading.id}: already in milliseconds`);
            skipped++;
        } else {
            console.log(`⚠️ Unknown format for tank reading #${reading.id}: ${rawTimestamp} (${digits} digits)`);
        }
    }

    console.log(`\n✅ Done! Fixed: ${fixed}, Skipped: ${skipped}`);
}

fixTankReadingTimestamps().catch(console.error);
