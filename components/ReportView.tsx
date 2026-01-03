'use client';

import { useState, useMemo, useEffect } from 'react';
import MonthlyReport from './MonthlyReport';
import Link from 'next/link';
import { approveDailySheet } from '@/app/actions';
import { getAuth, canManageUsers } from '@/lib/auth';

type DailySheet = {
    id: number;
    date: Date;
    pumpId: number;
    salesPerson: string | null;
    totalNozzleSales: number;
    totalCreditSales: number;
    totalOilLube: number;
    totalExpenses: number;
    paytmAmount: number;
    cardAmount: number;
    fleatCardAmount: number;
    creditAmount: number;
    nightCashAmount: number;
    totalToBank: number;
    isApproved: boolean;
    approvedBy: string | null;
    approvedAt: Date | null;
};

type CumulativeDailyData = {
    date: string;
    pumps: { id: number; pumpId: number; salesPerson: string | null; isApproved: boolean }[];
    totalPumpSale: number;
    totalPaytmCard: number;
    totalCredit: number;
    totalExpense: number;
    totalNightCash: number;
    totalToBank: number;
    totalOilLube: number;
    allApproved: boolean;
    anyPending: boolean;
};

export default function ReportView({ dailySheets }: { dailySheets: DailySheet[] }) {
    const [view, setView] = useState<'daily' | 'monthly'>('daily');
    const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    useEffect(() => {
        const user = getAuth();
        if (user) {
            setCurrentUser(user);
            setIsOwnerOrAdmin(user.role === 'admin' || user.role === 'owner');
        }
    }, []);

    // Group daily sheets by date and calculate cumulative totals
    const cumulativeData = useMemo(() => {
        const grouped: Record<string, CumulativeDailyData> = {};

        dailySheets.forEach(sheet => {
            const dateStr = new Date(sheet.date).toISOString().split('T')[0];

            if (!grouped[dateStr]) {
                grouped[dateStr] = {
                    date: dateStr,
                    pumps: [],
                    totalPumpSale: 0,
                    totalPaytmCard: 0,
                    totalCredit: 0,
                    totalExpense: 0,
                    totalNightCash: 0,
                    totalToBank: 0,
                    totalOilLube: 0,
                    allApproved: true,
                    anyPending: false,
                };
            }

            grouped[dateStr].pumps.push({
                id: sheet.id,
                pumpId: sheet.pumpId,
                salesPerson: sheet.salesPerson,
                isApproved: sheet.isApproved
            });
            grouped[dateStr].totalPumpSale += sheet.totalNozzleSales || 0;
            grouped[dateStr].totalPaytmCard += (sheet.paytmAmount || 0) + (sheet.cardAmount || 0) + (sheet.fleatCardAmount || 0);
            grouped[dateStr].totalCredit += sheet.totalCreditSales || 0;
            grouped[dateStr].totalExpense += sheet.totalExpenses || 0;
            grouped[dateStr].totalNightCash += sheet.nightCashAmount || 0;
            grouped[dateStr].totalToBank += sheet.totalToBank || 0;
            grouped[dateStr].totalOilLube += sheet.totalOilLube || 0;

            if (!sheet.isApproved) {
                grouped[dateStr].allApproved = false;
                grouped[dateStr].anyPending = true;
            }
        });

        // Sort by date descending
        return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dailySheets]);

    const handleApprove = async (pumpId: number) => {
        if (!currentUser) return;

        setApprovingId(pumpId);
        const result = await approveDailySheet(pumpId, currentUser.username);
        setApprovingId(null);

        if (result.success) {
            // Page will refresh due to revalidatePath
            window.location.reload();
        } else {
            alert(result.error || 'Failed to approve');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px 20px' }}>
            <div className="pos-container">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#212529' }}>
                            {view === 'daily' ? 'Daily Sheets' : 'Monthly Summary'}
                        </h1>
                        <p style={{ color: '#6c757d', fontSize: '14px' }}>
                            {view === 'daily' ? 'Cumulative data from all pumps' : 'Monthly sales breakdown'}
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div style={{ display: 'flex', background: '#f8f9fa', padding: '4px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <button
                            onClick={() => setView('daily')}
                            style={{
                                padding: '8px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '3px',
                                border: 'none',
                                cursor: 'pointer',
                                background: view === 'daily' ? '#2196f3' : 'transparent',
                                color: view === 'daily' ? '#ffffff' : '#6c757d',
                                transition: 'all 0.2s'
                            }}
                        >
                            Daily
                        </button>
                        <button
                            onClick={() => setView('monthly')}
                            style={{
                                padding: '8px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '3px',
                                border: 'none',
                                cursor: 'pointer',
                                background: view === 'monthly' ? '#2196f3' : 'transparent',
                                color: view === 'monthly' ? '#ffffff' : '#6c757d',
                                transition: 'all 0.2s'
                            }}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                {/* Content */}
                {view === 'daily' ? (
                    <div className="pos-section">
                        <div className="pos-section-header">
                            Daily Summary (All Pumps Combined)
                        </div>
                        <table className="pos-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Pump Sale</th>
                                    <th style={{ textAlign: 'right' }}>Paytm & Card</th>
                                    <th style={{ textAlign: 'right' }}>Credit</th>
                                    <th style={{ textAlign: 'right' }}>Expense</th>
                                    <th style={{ textAlign: 'right' }}>Night Cash</th>
                                    <th style={{ textAlign: 'right' }}>To Bank</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cumulativeData.map((row, idx) => (
                                    <tr key={idx} style={{ background: row.anyPending ? '#fffde7' : 'transparent' }}>
                                        <td style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', fontWeight: '600' }}>
                                            {row.date}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {row.pumps.map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span
                                                            style={{
                                                                background: p.pumpId === 1 ? '#e3f2fd' : '#fff3e0',
                                                                color: p.pumpId === 1 ? '#1565c0' : '#e65100',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            P{p.pumpId}
                                                        </span>
                                                        {p.isApproved ? (
                                                            <span style={{
                                                                background: '#e8f5e9',
                                                                color: '#2e7d32',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                fontSize: '10px',
                                                                fontWeight: '600'
                                                            }}>
                                                                ✓ APPROVED
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                background: '#fff3e0',
                                                                color: '#e65100',
                                                                padding: '2px 6px',
                                                                borderRadius: '3px',
                                                                fontSize: '10px',
                                                                fontWeight: '600'
                                                            }}>
                                                                PENDING
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600' }}>
                                            ₹{row.totalPumpSale.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#9c27b0' }}>
                                            ₹{row.totalPaytmCard.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#d32f2f' }}>
                                            ₹{row.totalCredit.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#ff5722' }}>
                                            ₹{row.totalExpense.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#ff9800' }}>
                                            ₹{row.totalNightCash.toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '700', color: '#4caf50' }}>
                                            ₹{(row.totalToBank + row.totalNightCash).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                                {/* Approve buttons for each pending pump */}
                                                {isOwnerOrAdmin && row.pumps.filter(p => !p.isApproved).map((p, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleApprove(p.id)}
                                                        disabled={approvingId === p.id}
                                                        style={{
                                                            padding: '6px 12px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            background: approvingId === p.id ? '#ccc' : '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: approvingId === p.id ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {approvingId === p.id ? 'APPROVING...' : `APPROVE P${p.pumpId}`}
                                                    </button>
                                                ))}

                                                {/* Edit button */}
                                                <Link
                                                    href={`/sale?date=${row.date}`}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        background: '#2196f3',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        borderRadius: '3px',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    EDIT
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {cumulativeData.length === 0 && (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', fontStyle: 'italic' }}>
                                            No daily sheets found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Summary Row */}
                        {cumulativeData.length > 0 && (
                            <div style={{
                                background: '#f8f9fa',
                                padding: '16px 20px',
                                borderTop: '2px solid #dee2e6',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: '20px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>Total Pump Sale</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace' }}>
                                        ₹{cumulativeData.reduce((sum, r) => sum + r.totalPumpSale, 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>Total Paytm & Card</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#9c27b0' }}>
                                        ₹{cumulativeData.reduce((sum, r) => sum + r.totalPaytmCard, 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>Total Credit</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#d32f2f' }}>
                                        ₹{cumulativeData.reduce((sum, r) => sum + r.totalCredit, 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>Total Expense</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#ff5722' }}>
                                        ₹{cumulativeData.reduce((sum, r) => sum + r.totalExpense, 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>Total Night Cash</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#ff9800' }}>
                                        ₹{cumulativeData.reduce((sum, r) => sum + r.totalNightCash, 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>Total To Bank (incl. Night Cash)</div>
                                    <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#4caf50' }}>
                                        ₹{cumulativeData.reduce((sum, r) => sum + r.totalToBank + r.totalNightCash, 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <MonthlyReport />
                )}
            </div>
        </div>
    );
}
