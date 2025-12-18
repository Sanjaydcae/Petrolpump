import { NextResponse } from 'next/server';
import { saveTankReading } from '@/app/actions';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const result = await saveTankReading(data);

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error('Save tank reading API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save tank reading' },
            { status: 500 }
        );
    }
}
