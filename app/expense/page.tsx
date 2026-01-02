'use client';

import { useState, useEffect } from 'react';
import { addExpense, getExpenses, deleteExpense } from '@/app/actions';

type Expense = {
    id: number;
    name: string;
    amount: number;
    date: Date;
    createdAt: Date;
};

export default function ExpensePage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, setIsPending] = useState(false);

    // Filter state
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadExpenses();
    }, []);

    async function loadExpenses() {
        setIsLoading(true);
        const data = await getExpenses();
        setExpenses(data as Expense[]);
        setIsLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !amount) return;

        setIsPending(true);
        const result = await addExpense({
            name,
            amount: parseFloat(amount),
            date,
        });

        if (result.success) {
            setName('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            loadExpenses();
        } else {
            alert(result.error || 'Failed to add expense');
        }
        setIsPending(false);
    }

    async function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this expense?')) {
            await deleteExpense(id);
            loadExpenses();
        }
    }

    // Filter expenses by selected month
    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() + 1 === filterMonth && expenseDate.getFullYear() === filterYear;
    });

    const monthlyTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Expense Management</h1>
                    <p style={{ color: '#6c757d' }}>Track monthly pump expenses</p>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>ALL TIME EXPENSES</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#d32f2f' }}>₹{allTimeTotal.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: '#ffebee', padding: '20px', borderRadius: '8px', border: '1px solid #ef9a9a' }}>
                        <div style={{ fontSize: '13px', color: '#c62828', marginBottom: '8px' }}>
                            {months.find(m => m.value === filterMonth)?.label} {filterYear} EXPENSES
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#d32f2f' }}>₹{monthlyTotal.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                {/* Add Expense Form */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Add New Expense</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 250px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>Expense Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter expense name"
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
                        <div style={{ flex: '0 1 180px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px' }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPending}
                            style={{
                                padding: '10px 24px',
                                background: '#d32f2f',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: isPending ? 0.7 : 1,
                            }}
                        >
                            {isPending ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                </div>

                {/* Filter */}
                <div style={{ background: '#fff', padding: '16px 24px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#6c757d', fontSize: '14px' }}>Filter by:</span>
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px' }}
                    >
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(parseInt(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '14px' }}
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Expenses List */}
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #dee2e6', background: '#f8f9fa' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600' }}>
                            {months.find(m => m.value === filterMonth)?.label} {filterYear} Expenses
                        </h2>
                    </div>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>Loading...</div>
                    ) : filteredExpenses.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No expenses found for this month.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>DATE</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>NAME</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6c757d' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', color: '#6c757d' }}>
                                            {new Date(expense.date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{expense.name}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: '#d32f2f' }}>₹{expense.amount.toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
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
