'use client';

import { useState, useEffect } from 'react';
import { saveTankReading, getTankHistory, TANK_CAPACITIES } from '@/app/actions';

export default function TankPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [petrolLevel, setPetrolLevel] = useState('');
    const [dieselLevel, setDieselLevel] = useState('');
    const [recordedBy, setRecordedBy] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    async function loadHistory() {
        const data = await getTankHistory(20);
        setHistory(data);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsPending(true);

        try {
            // Save Petrol reading if entered
            if (petrolLevel) {
                await saveTankReading({
                    date,
                    tank: 'Petrol',
                    dipReading: parseFloat(petrolLevel),
                    recordedBy: recordedBy || undefined,
                });
            }

            // Save Diesel reading if entered
            if (dieselLevel) {
                await saveTankReading({
                    date,
                    tank: 'Diesel',
                    dipReading: parseFloat(dieselLevel),
                    recordedBy: recordedBy || undefined,
                });
            }

            alert('Tank readings saved successfully!');
            setPetrolLevel('');
            setDieselLevel('');
            loadHistory();
        } catch (error) {
            alert('Failed to save tank readings');
        }

        setIsPending(false);
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
            <div className="pos-container">
                <div className="pos-header">
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Tank DIP Readings</h1>
                        <div style={{ fontSize: '13px', color: '#495057' }}>Record fuel levels for Petrol & Diesel tanks</div>
                    </div>
                </div>

                {/* Tank Capacities Info */}
                <div className="pos-grid-2" style={{ marginBottom: '20px' }}>
                    <div style={{ padding: '16px', background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#e65100', textTransform: 'uppercase', fontWeight: '600' }}>Petrol Tank Capacity</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff9800' }}>{TANK_CAPACITIES.Petrol.toLocaleString('en-IN')} L</div>
                    </div>
                    <div style={{ padding: '16px', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#1565c0', textTransform: 'uppercase', fontWeight: '600' }}>Diesel Tank Capacity</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#2196f3' }}>{TANK_CAPACITIES.Diesel.toLocaleString('en-IN')} L</div>
                    </div>
                </div>

                {/* Entry Form */}
                <form onSubmit={handleSubmit}>
                    <div className="pos-section" style={{ marginBottom: '20px' }}>
                        <div className="pos-section-header">Enter DIP Reading</div>
                        <div style={{ padding: '20px' }}>
                            <div className="pos-grid-2" style={{ marginBottom: '20px' }}>
                                <div>
                                    <label className="pos-label">Date</label>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pos-input" />
                                </div>
                                <div>
                                    <label className="pos-label">Recorded By</label>
                                    <input type="text" value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)} className="pos-input" placeholder="Manager name" />
                                </div>
                            </div>

                            <div className="pos-grid-2">
                                <div style={{ padding: '20px', background: '#fff8e1', border: '2px solid #ffcc80', borderRadius: '8px' }}>
                                    <label className="pos-label" style={{ color: '#e65100', fontSize: '14px' }}>⛽ Petrol Tank Level (Liters)</label>
                                    <input
                                        type="number"
                                        value={petrolLevel}
                                        onChange={(e) => setPetrolLevel(e.target.value)}
                                        className="pos-input"
                                        placeholder="Enter DIP reading"
                                        style={{ fontSize: '20px', padding: '12px', textAlign: 'center' }}
                                        max={TANK_CAPACITIES.Petrol}
                                    />
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px', textAlign: 'center' }}>
                                        Max: {TANK_CAPACITIES.Petrol.toLocaleString('en-IN')} L
                                    </div>
                                </div>
                                <div style={{ padding: '20px', background: '#e3f2fd', border: '2px solid #90caf9', borderRadius: '8px' }}>
                                    <label className="pos-label" style={{ color: '#1565c0', fontSize: '14px' }}>⛽ Diesel Tank Level (Liters)</label>
                                    <input
                                        type="number"
                                        value={dieselLevel}
                                        onChange={(e) => setDieselLevel(e.target.value)}
                                        className="pos-input"
                                        placeholder="Enter DIP reading"
                                        style={{ fontSize: '20px', padding: '12px', textAlign: 'center' }}
                                        max={TANK_CAPACITIES.Diesel}
                                    />
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px', textAlign: 'center' }}>
                                        Max: {TANK_CAPACITIES.Diesel.toLocaleString('en-IN')} L
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                <button type="submit" disabled={isPending || (!petrolLevel && !dieselLevel)} className="pos-btn pos-btn-primary" style={{ fontSize: '16px', padding: '14px 40px' }}>
                                    {isPending ? 'SAVING...' : 'SAVE READINGS'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* History */}
                <div className="pos-section">
                    <div className="pos-section-header">Reading History</div>
                    <table className="pos-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Tank</th>
                                <th style={{ textAlign: 'right' }}>DIP Reading</th>
                                <th style={{ textAlign: 'right' }}>% Full</th>
                                <th>Recorded By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', fontStyle: 'italic' }}>
                                        No readings recorded yet
                                    </td>
                                </tr>
                            ) : (
                                history.map((reading: any, idx) => {
                                    const capacity = reading.tank === 'Petrol' ? TANK_CAPACITIES.Petrol : TANK_CAPACITIES.Diesel;
                                    const percentage = Math.round((reading.dipReading / capacity) * 100);
                                    const color = reading.tank === 'Petrol' ? '#ff9800' : '#2196f3';
                                    const bgColor = percentage < 20 ? '#ffebee' : percentage < 50 ? '#fff8e1' : '#e8f5e9';
                                    const statusColor = percentage < 20 ? '#d32f2f' : percentage < 50 ? '#ff9800' : '#4caf50';

                                    return (
                                        <tr key={idx} style={{ background: bgColor }}>
                                            <td>{new Date(reading.date).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <span style={{ color, fontWeight: '600' }}>{reading.tank}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontWeight: '600' }}>
                                                {reading.dipReading.toLocaleString('en-IN')} L
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ color: statusColor, fontWeight: '700' }}>{percentage}%</span>
                                            </td>
                                            <td style={{ color: '#6c757d' }}>{reading.recordedBy || '-'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
