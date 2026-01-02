'use client';

import { useState, useEffect } from 'react';
import { getCredits, updateCreditStatus } from '@/app/actions';

type Credit = {
    id: number;
    name: string;
    amount: number;
    status: string;
    receivedDate: Date | null;
    createdAt: Date;
};

export default function CreditPage() {
    const [credits, setCredits] = useState<Credit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDate, setEditDate] = useState('');

    useEffect(() => {
        loadCredits();
    }, []);

    async function loadCredits() {
        setIsLoading(true);
        const data = await getCredits();
        setCredits(data as Credit[]);
        setIsLoading(false);
    }

    async function handleStatusChange(id: number, newStatus: 'received' | 'pending') {
        if (newStatus === 'received') {
            // Show date picker for received date
            setEditingId(id);
            setEditDate(new Date().toISOString().split('T')[0]);
        } else {
            // Set to pending, clear received date
            await updateCreditStatus(id, newStatus, undefined);
            loadCredits();
        }
    }

    async function handleDateConfirm(id: number) {
        await updateCreditStatus(id, 'received', editDate);
        setEditingId(null);
        setEditDate('');
        loadCredits();
    }

    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);
    const totalReceived = credits.filter(c => c.status === 'received').reduce((sum, c) => sum + c.amount, 0);
    const totalPending = credits.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Credit Management</h1>
                    <p style={{ color: '#6c757d' }}>Credits added from Daily Entry are shown here. Update status when received.</p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>TOTAL CREDITS</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#2196f3' }}>₹{totalCredits.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', border: '1px solid #a5d6a7' }}>
                        <div style={{ fontSize: '13px', color: '#2e7d32', marginBottom: '8px' }}>RECEIVED</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#4caf50' }}>₹{totalReceived.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', border: '1px solid #ffcc80' }}>
                        <div style={{ fontSize: '13px', color: '#e65100', marginBottom: '8px' }}>PENDING</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff9800' }}>₹{totalPending.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                {/* Credits List */}
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600' }}>All Credits</h2>
                    </div>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Loading...</div>
                    ) : credits.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No credits found. Add credits from the Daily Entry tab.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>DATE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>RECEIVED DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {credits.map((credit) => (
                                    <tr key={credit.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', color: '#6c757d' }}>
                                            {new Date(credit.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{credit.name}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: '#2196f3' }}>₹{credit.amount.toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {editingId === credit.id ? (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                    <input
                                                        type="date"
                                                        value={editDate}
                                                        onChange={(e) => setEditDate(e.target.value)}
                                                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #dee2e6', fontSize: '12px' }}
                                                    />
                                                    <button
                                                        onClick={() => handleDateConfirm(credit.id)}
                                                        style={{ padding: '6px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        style={{ padding: '6px 12px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={credit.status}
                                                    onChange={(e) => handleStatusChange(credit.id, e.target.value as 'received' | 'pending')}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        border: 'none',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        background: credit.status === 'received' ? '#e8f5e9' : '#fff3e0',
                                                        color: credit.status === 'received' ? '#2e7d32' : '#e65100',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="received">Received</option>
                                                </select>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: credit.receivedDate ? '#2e7d32' : '#6c757d', fontWeight: credit.receivedDate ? '600' : '400' }}>
                                            {credit.receivedDate ? new Date(credit.receivedDate).toLocaleDateString('en-IN') : 'Not received'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
