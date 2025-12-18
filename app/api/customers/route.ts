import { NextResponse } from 'next/server';
import { getDistinctCreditCustomers } from '@/app/actions';

export async function GET() {
    try {
        const customers = await getDistinctCreditCustomers();
        return NextResponse.json(customers);
    } catch (error) {
        console.error('Customers API error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
