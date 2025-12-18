import { NextResponse } from 'next/server';
import { getLatestTankReadings } from '@/app/actions';

export async function GET() {
    try {
        const tanks = await getLatestTankReadings();
        return NextResponse.json(tanks);
    } catch (error) {
        console.error('Tank readings API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tank readings' },
            { status: 500 }
        );
    }
}
