'use client';

import { useState, useEffect } from 'react';
import { addCredit, getCredits, updateCreditStatus, deleteCredit } from '@/app/actions';

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
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'received' | 'pending'>('pending');
    const [receivedDate, setReceivedDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        loadCredits();
    }, []);

    async function loadCredits() {
        setIsLoading(true);
        const data = await getCredits();
        setCredits(data as Credit[]);
        setIsLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !amount) return;

        setIsPending(true);
        const result = await addCredit({
            name,
            amount: parseFloat(amount),
            status,
            receivedDate: status === 'received' ? receivedDate : undefined,
        });

        if (result.success) {
            setName('');
            setAmount('');
            setStatus('pending');
            setReceivedDate('');
            loadCredits();
        } else {
            alert(result.error || 'Failed to add credit');
        }
        setIsPending(false);
    }

    async function handleStatusChange(id: number, newStatus: 'received' | 'pending', credit: Credit) {
        const dateToUse = newStatus === 'received' ? new Date().toISOString().split('T')[0] : undefined;
        await updateCreditStatus(id, newStatus, dateToUse);
        loadCredits();
    }

    async function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this credit?')) {
            await deleteCredit(id);
            loadCredits();
        }
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
                    <p style={{ color: '#6c757d' }}>Track and manage all credits</p>
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

                {/* Add Credit Form */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Add New Credit</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>Credit Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter credit name"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px' }}
                                required
                            />
                        </div>
                        <div style={{ flex: '0 1 150px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>Amount (₹)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px' }}
                                required
                            />
                        </div>
                        <div style={{ flex: '0 1 150px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'received' | 'pending')}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px', background: '#fff' }}
                            >
                                <option value="pending">Pending</option>
                                <option value="received">Received</option>
                            </select>
                        </div>
                        {status === 'received' && (
                            <div style={{ flex: '0 1 180px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>Received Date</label>
                                <input
                                    type="date"
                                    value={receivedDate}
                                    onChange={(e) => setReceivedDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px' }}
                                    required
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isPending}
                            style={{
                                padding: '10px 24px',
                                background: '#2196f3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: isPending ? 0.7 : 1,
                            }}
                        >
                            {isPending ? 'Adding...' : 'Add Credit'}
                        </button>
                    </form>
                </div>

                {/* Credits List */}
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600' }}>All Credits</h2>
                    </div>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Loading...</div>
                    ) : credits.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No credits found. Add your first credit above.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>RECEIVED DATE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {credits.map((credit) => (
                                    <tr key={credit.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{credit.name}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: '#2196f3' }}>₹{credit.amount.toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <select
                                                value={credit.status}
                                                onChange={(e) => handleStatusChange(credit.id, e.target.value as 'received' | 'pending', credit)}
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
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#6c757d' }}>
                                            {credit.receivedDate ? new Date(credit.receivedDate).toLocaleDateString('en-IN') : '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(credit.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#ffebee',
                                                    color: '#d32f2f',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Delete
                                            </button>
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
