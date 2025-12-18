import { NextResponse } from 'next/server';
import { saveDailySheet } from '@/app/actions';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const result = await saveDailySheet(data);

        if (result.success) {
            return NextResponse.json(result);
        } else if (result.error) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Save daily sheet API error:', error);
        return NextResponse.json(
            { error: 'Failed to save daily sheet' },
            { status: 500 }
        );
    }
}
