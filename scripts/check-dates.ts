import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://petrolpump-sanjaycae.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjUwMjI4NTksImlkIjoiZWE4NjVhOTItY2E5YS00YmQ1LThmMDgtOTZjZjNhMWQxMWMxIiwicmlkIjoiMTk5N2ZkOTUtZjU0ZS00MWRjLWI3YTctOGVjOGIyZDFhZDY0In0.zVigax-SmBwqAN5sKExN8ZKez2ZynaOcfGVIB2KXEDWw004Wq7oYp9i1Z-qtRPLyoqwdoWhNeTVszcNLYnjUCg'
});

async function checkDateFormat() {
    console.log('📅 Date Format Check...\n');

    const sheets = await client.execute('SELECT id, date, pump_id FROM daily_sheets LIMIT 5');
    sheets.rows.forEach((row: any) => {
        const rawDate = row.date;
        console.log(`ID: ${row.id}, Pump: ${row.pump_id}`);
        console.log(`  Raw value: ${rawDate} (type: ${typeof rawDate})`);
        console.log(`  As milliseconds: ${new Date(Number(rawDate)).toISOString()}`);
        console.log(`  As seconds (x1000): ${new Date(Number(rawDate) * 1000).toISOString()}`);

        // Check the number of digits to determine format
        const numDigits = String(rawDate).length;
        console.log(`  Digits: ${numDigits} (13=ms, 10=sec)`);
        console.log('');
    });
}

checkDateFormat();
