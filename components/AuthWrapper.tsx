'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Allow login page without authentication
        if (pathname === '/login') {
            setIsChecking(false);
            return;
        }

        // Check if user is authenticated
        if (!isAuthenticated()) {
            router.push('/login');
        } else {
            setIsChecking(false);
        }
    }, [pathname, router]);

    // Show loading state while checking auth
    if (isChecking && pathname !== '/login') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#f5f5f5'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#495057'
                    }}>Loading...</div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
