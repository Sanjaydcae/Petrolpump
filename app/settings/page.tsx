'use client';

import { resetDatabase, getUsers, createUser, deleteUser } from '@/app/actions';
import { useState, useEffect } from 'react';
import { getAuth, canManageUsers } from '@/lib/auth';

export default function SettingsPage() {
    const [isResetting, setIsResetting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'owner' as 'owner' | 'manager' });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const currentUser = getAuth();
        setIsAdmin(currentUser?.role === 'admin');
        if (currentUser?.role === 'admin') {
            loadUsers();
        }
    }, []);

    const loadUsers = async () => {
        const allUsers = await getUsers();
        setUsers(allUsers);
    };

    const handleReset = async () => {
        setIsResetting(true);
        const result = await resetDatabase();
        if (result.success) {
            alert('System reset successfully! All data has been cleared.');
            setShowConfirm(false);
        } else {
            alert('Failed to reset system.');
        }
        setIsResetting(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await createUser(newUser.username, newUser.password, newUser.role);
        if (result.success) {
            alert('User created successfully!');
            setNewUser({ username: '', password: '', role: 'owner' });
            setShowUserForm(false);
            loadUsers();
        } else {
            alert(result.error || 'Failed to create user');
        }
    };

    const [userToDelete, setUserToDelete] = useState<{ id: number; username: string } | null>(null);

    const handleDeleteUser = async (userId: number, username: string) => {
        console.log('[CLIENT] handleDeleteUser called with:', { userId, username });

        // If this is the user we're already confirming, proceed with delete
        if (userToDelete && userToDelete.id === userId) {
            console.log('[CLIENT] Proceeding with deletion');

            try {
                const result = await deleteUser(userId);
                console.log('[CLIENT] Delete result:', result);

                if (result.success) {
                    alert('User deleted successfully!');
                    setUserToDelete(null);
                    loadUsers();
                } else {
                    alert(result.error || 'Failed to delete user');
                    setUserToDelete(null);
                }
            } catch (error) {
                console.error('[CLIENT] Error calling deleteUser:', error);
                alert('An error occurred while deleting the user');
                setUserToDelete(null);
            }
        } else {
            // First click - set confirmation state
            console.log('[CLIENT] Setting confirmation for user:', username);
            setUserToDelete({ id: userId, username });
        }
    };

    return (
        <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px 20px' }}>
            <div className="pos-container">

                {/* HEADER */}
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#212529' }}>Settings</h1>
                    <p style={{ color: '#6c757d', fontSize: '14px' }}>System configuration and maintenance</p>
                </div>

                {/* USER MANAGEMENT - Admin Only */}
                {isAdmin && (
                    <div className="pos-card" style={{ marginBottom: '30px', borderLeft: '4px solid #2196f3' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#212529' }}>User Management</h2>
                            <button
                                onClick={() => setShowUserForm(!showUserForm)}
                                className="pos-btn"
                                style={{
                                    background: '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    fontSize: '13px'
                                }}
                            >
                                {showUserForm ? 'CANCEL' : '+ ADD USER'}
                            </button>
                        </div>

                        {/* Add User Form */}
                        {showUserForm && (
                            <form onSubmit={handleCreateUser} style={{ background: '#f8f9fa', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                                    <div>
                                        <label className="pos-label">Username</label>
                                        <input
                                            type="text"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            className="pos-input"
                                            placeholder="Enter username"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="pos-label">Password</label>
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="pos-input"
                                            placeholder="Enter password"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="pos-label">Role</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'owner' | 'manager' })}
                                            className="pos-input"
                                        >
                                            <option value="owner">Owner</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="pos-btn pos-btn-primary">
                                        CREATE USER
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Users List */}
                        <table className="pos-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td style={{ fontWeight: '600' }}>{user.username}</td>
                                        <td>
                                            <span style={{
                                                background: user.role === 'admin' ? '#e3f2fd' : user.role === 'owner' ? '#fff3e0' : '#f3e5f5',
                                                color: user.role === 'admin' ? '#1565c0' : user.role === 'owner' ? '#e65100' : '#6a1b9a',
                                                padding: '4px 8px',
                                                borderRadius: '3px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#6c757d' }}>
                                            {new Date(user.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {user.role !== 'admin' && (
                                                <div>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            background: userToDelete?.id === user.id ? '#d32f2f' : '#ffebee',
                                                            color: userToDelete?.id === user.id ? '#ffffff' : '#d32f2f',
                                                            border: userToDelete?.id === user.id ? '1px solid #d32f2f' : '1px solid #ef9a9a',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {userToDelete?.id === user.id ? 'CLICK AGAIN TO CONFIRM' : 'DELETE'}
                                                    </button>
                                                    {userToDelete?.id === user.id && (
                                                        <div style={{ fontSize: '10px', color: '#d32f2f', marginTop: '4px' }}>
                                                            Click again to delete "{user.username}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#adb5bd' }}>
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SYSTEM INFO */}
                <div className="pos-card" style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#212529' }}>System Information</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', fontSize: '14px' }}>
                        <span style={{ color: '#6c757d', fontWeight: '600' }}>Application:</span>
                        <span>KOZHANTHAVEL AGENCY</span>

                        <span style={{ color: '#6c757d', fontWeight: '600' }}>Version:</span>
                        <span>1.0.0</span>

                        <span style={{ color: '#6c757d', fontWeight: '600' }}>Database:</span>
                        <span>SQLite (Local)</span>
                    </div>
                </div>

                {/* DANGER ZONE - Admin Only */}
                {isAdmin && (
                    <div className="pos-card" style={{ borderLeft: '4px solid #d32f2f' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#d32f2f' }}>Danger Zone</h2>
                        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '20px' }}>
                            Irreversible actions that affect your data integrity. Proceed with caution.
                        </p>

                        {!showConfirm ? (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="pos-btn"
                                style={{
                                    background: '#d32f2f',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                MASTER RESET SYSTEM
                            </button>
                        ) : (
                            <div style={{ background: '#ffebee', border: '2px solid #ef5350', padding: '20px', borderRadius: '4px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#c62828', marginBottom: '8px' }}>
                                    ⚠️ CONFIRMATION REQUIRED
                                </div>
                                <p style={{ fontSize: '13px', color: '#d32f2f', marginBottom: '20px' }}>
                                    Are you absolutely sure? This will permanently delete <strong>ALL</strong> daily sheets, sales records, and inventory data. This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleReset}
                                        disabled={isResetting}
                                        className="pos-btn"
                                        style={{
                                            background: '#d32f2f',
                                            color: 'white',
                                            border: 'none',
                                            opacity: isResetting ? 0.5 : 1
                                        }}
                                    >
                                        {isResetting ? 'RESETTING...' : 'YES, DELETE EVERYTHING'}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="pos-btn"
                                        style={{
                                            background: '#f8f9fa',
                                            color: '#495057',
                                            border: '1px solid #dee2e6'
                                        }}
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </main>
    );
}
