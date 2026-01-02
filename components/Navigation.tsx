'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, clearAuth, type AuthUser } from '@/lib/auth';

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        setCurrentUser(getAuth());
    }, []);

    // Don't show navigation on login page
    if (pathname === '/login') {
        return null;
    }

    const handleLogout = () => {
        clearAuth();
        router.push('/login');
    };

    const links = [
        { name: 'Dashboard', href: '/' },
        { name: 'Daily Entry', href: '/sale' },
        { name: 'Credit', href: '/credit' },
        { name: 'Expense', href: '/expense' },
        { name: 'Reports', href: '/report' },
        { name: 'Tank', href: '/tank' },
        { name: 'Settings', href: '/settings' },
    ];

    return (
        <nav style={{ background: '#ffffff', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, zIndex: 50 }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img
                            src="/bpcl-logo.png"
                            alt="BPCL Logo"
                            style={{ height: '60px', width: 'auto' }}
                        />
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#212529', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
                                KOZHANTHAVEL AGENCY
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d', fontWeight: '500', lineHeight: '1.3', marginTop: '2px' }}>
                                Mailam pondy Road, Thazhuthali village, Tindivanam Taluk, Tamil Nadu 604304
                            </div>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        transition: 'all 0.2s',
                                        background: isActive ? '#2196f3' : 'transparent',
                                        color: isActive ? '#ffffff' : '#6c757d',
                                        border: isActive ? 'none' : '1px solid transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = '#f8f9fa';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}

                        {/* User & Logout */}
                        {currentUser && (
                            <>
                                <div style={{
                                    paddingLeft: '16px',
                                    marginLeft: '8px',
                                    borderLeft: '1px solid #dee2e6',
                                    fontSize: '13px',
                                    color: '#6c757d'
                                }}>
                                    <div style={{ fontWeight: '600', color: '#212529' }}>{currentUser.username}</div>
                                    <div style={{ fontSize: '11px', textTransform: 'capitalize' }}>{currentUser.role}</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        borderRadius: '4px',
                                        border: '1px solid #d32f2f',
                                        background: 'white',
                                        color: '#d32f2f',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#d32f2f';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.color = '#d32f2f';
                                    }}
                                >
                                    LOGOUT
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
