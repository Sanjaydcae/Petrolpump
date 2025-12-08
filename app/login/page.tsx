'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../actions';
import { setAuth } from '@/lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        if (result.success && result.user) {
            setAuth(result.user);
            router.push('/');
        } else {
            setError(result.error || 'Login failed');
        }

        setIsLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            {/* Left Side - Image */}
            <div style={{
                flex: 1,
                backgroundImage: 'url(/petrol-pump.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                minHeight: '100vh'
            }}>
                {/* Light overlay for subtle depth */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.1)'
                }} />

                {/* BPCL Logo */}
                <div style={{
                    position: 'absolute',
                    top: '30px',
                    left: '30px',
                    zIndex: 10
                }}>
                    <img
                        src="/bpcl-logo.png"
                        alt="BPCL Logo"
                        style={{
                            width: '120px',
                            height: 'auto',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}
                    />
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: 1,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                position: 'relative'
            }}>
                {/* H2ONE Cleantech Logo - Top Right */}
                <div style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    zIndex: 10
                }}>
                    <img
                        src="/h2one-logo.png"
                        alt="H2ONE Cleantech Private Limited"
                        style={{
                            width: '150px',
                            height: 'auto',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}
                    />
                </div>
                <div style={{ maxWidth: '420px', width: '100%' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            marginBottom: '8px',
                            color: '#212529',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap'
                        }}>
                            KOZHANTHAVEL AGENCY
                        </h1>
                        <p style={{ color: '#6c757d', fontSize: '16px' }}>Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label className="pos-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="pos-input"
                                placeholder="Enter your username"
                                style={{ color: '#212529' }}
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label className="pos-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pos-input"
                                placeholder="Enter your password"
                                style={{ color: '#212529' }}
                                required
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: '#ffebee',
                                border: '1px solid #ef5350',
                                padding: '12px',
                                borderRadius: '4px',
                                marginBottom: '24px',
                                color: '#c62828',
                                fontSize: '14px'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="pos-btn pos-btn-primary"
                            style={{ width: '100%', fontSize: '16px', padding: '14px' }}
                        >
                            {isLoading ? 'Signing in...' : 'SIGN IN'}
                        </button>
                    </form>

                    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #dee2e6', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: '#adb5bd' }}>
                            Created by H2one Cleantech Private Limited.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
