import { NextResponse } from 'next/server';
import { getDailySheets } from '@/app/actions';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '30');

        const sheets = await getDailySheets();
        return NextResponse.json(sheets.slice(0, limit));
    } catch (error) {
        console.error('Daily sheets API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily sheets' },
            { status: 500 }
        );
    }
}
