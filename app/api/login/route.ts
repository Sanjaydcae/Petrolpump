import { NextResponse } from 'next/server';
import { login } from '@/app/actions';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password required' },
                { status: 400 }
            );
        }

        const result = await login(username, password);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
