'use client';

import { useState, useEffect } from 'react';
import { saveTankReading, getTankHistory, updateTankReading, deleteTankReading } from '@/app/actions';
import { TANK_CAPACITIES } from '@/lib/constants';

export default function TankPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordedBy, setRecordedBy] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Petrol tank inputs
    const [petrolDip, setPetrolDip] = useState('');
    const [petrolLiters, setPetrolLiters] = useState('');

    // Diesel tank inputs
    const [dieselDip, setDieselDip] = useState('');
    const [dieselLiters, setDieselLiters] = useState('');

    // Edit modal state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDip, setEditDip] = useState('');
    const [editLiters, setEditLiters] = useState('');

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
            if (petrolDip && petrolLiters) {
                await saveTankReading({
                    date,
                    tank: 'Petrol',
                    dipReading: parseFloat(petrolDip),
                    liters: parseFloat(petrolLiters),
                    recordedBy: recordedBy || undefined,
                });
            }

            if (dieselDip && dieselLiters) {
                await saveTankReading({
                    date,
                    tank: 'Diesel',
                    dipReading: parseFloat(dieselDip),
                    liters: parseFloat(dieselLiters),
                    recordedBy: recordedBy || undefined,
                });
            }

            alert('Tank readings saved successfully!');
            setPetrolDip('');
            setPetrolLiters('');
            setDieselDip('');
            setDieselLiters('');
            loadHistory();
        } catch (error) {
            alert('Failed to save tank readings');
        }

        setIsPending(false);
    }

    function openEditModal(reading: any) {
        setEditingId(reading.id);
        setEditDip(reading.dipReading.toString());
        setEditLiters((reading.liters || reading.dipReading).toString());
    }

    async function handleEdit() {
        if (!editingId) return;
        setIsPending(true);

        const result = await updateTankReading(editingId, {
            dipReading: parseFloat(editDip),
            liters: parseFloat(editLiters),
        });

        if (result.success) {
            setEditingId(null);
            loadHistory();
        } else {
            alert('Failed to update reading');
        }
        setIsPending(false);
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this reading?')) return;

        const result = await deleteTankReading(id);
        if (result.success) {
            loadHistory();
        } else {
            alert('Failed to delete reading');
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
            <div className="pos-container">
                <div className="pos-header">
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Tank DIP Readings</h1>
                        <div style={{ fontSize: '13px', color: '#495057' }}>Record DIP and Liter readings for Petrol & Diesel tanks</div>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingId && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90vw' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Edit Reading</h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="pos-label">DIP Reading (cm/mm)</label>
                                <input type="number" value={editDip} onChange={(e) => setEditDip(e.target.value)} className="pos-input" />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label className="pos-label">Liters</label>
                                <input type="number" value={editLiters} onChange={(e) => setEditLiters(e.target.value)} className="pos-input" />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditingId(null)} className="pos-btn" style={{ background: '#f8f9fa', color: '#495057' }}>
                                    Cancel
                                </button>
                                <button onClick={handleEdit} disabled={isPending} className="pos-btn pos-btn-primary">
                                    {isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                        <div className="pos-section-header">Enter DIP & Liter Reading</div>
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
                                {/* Petrol Tank */}
                                <div style={{ padding: '20px', background: '#fff8e1', border: '2px solid #ffcc80', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#e65100', marginBottom: '16px' }}>⛽ PETROL TANK</div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="pos-label" style={{ color: '#e65100' }}>DIP Reading (cm/mm)</label>
                                        <input type="number" value={petrolDip} onChange={(e) => setPetrolDip(e.target.value)} className="pos-input" placeholder="Enter DIP" style={{ fontSize: '18px', textAlign: 'center' }} />
                                    </div>
                                    <div>
                                        <label className="pos-label" style={{ color: '#e65100' }}>Liters in Tank</label>
                                        <input type="number" value={petrolLiters} onChange={(e) => setPetrolLiters(e.target.value)} className="pos-input" placeholder="Enter liters" style={{ fontSize: '18px', textAlign: 'center' }} max={TANK_CAPACITIES.Petrol} />
                                    </div>
                                </div>

                                {/* Diesel Tank */}
                                <div style={{ padding: '20px', background: '#e3f2fd', border: '2px solid #90caf9', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1565c0', marginBottom: '16px' }}>⛽ DIESEL TANK</div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="pos-label" style={{ color: '#1565c0' }}>DIP Reading (cm/mm)</label>
                                        <input type="number" value={dieselDip} onChange={(e) => setDieselDip(e.target.value)} className="pos-input" placeholder="Enter DIP" style={{ fontSize: '18px', textAlign: 'center' }} />
                                    </div>
                                    <div>
                                        <label className="pos-label" style={{ color: '#1565c0' }}>Liters in Tank</label>
                                        <input type="number" value={dieselLiters} onChange={(e) => setDieselLiters(e.target.value)} className="pos-input" placeholder="Enter liters" style={{ fontSize: '18px', textAlign: 'center' }} max={TANK_CAPACITIES.Diesel} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                <button type="submit" disabled={isPending || ((!petrolDip || !petrolLiters) && (!dieselDip || !dieselLiters))} className="pos-btn pos-btn-primary" style={{ fontSize: '16px', padding: '14px 40px' }}>
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
                                <th style={{ textAlign: 'right' }}>DIP</th>
                                <th style={{ textAlign: 'right' }}>Liters</th>
                                <th style={{ textAlign: 'right' }}>% Full</th>
                                <th>Recorded By</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', fontStyle: 'italic' }}>
                                        No readings recorded yet
                                    </td>
                                </tr>
                            ) : (
                                history.map((reading: any, idx) => {
                                    const capacity = reading.tank === 'Petrol' ? TANK_CAPACITIES.Petrol : TANK_CAPACITIES.Diesel;
                                    const liters = reading.liters || reading.dipReading;
                                    const percentage = Math.round((liters / capacity) * 100);
                                    const color = reading.tank === 'Petrol' ? '#ff9800' : '#2196f3';
                                    const bgColor = percentage < 20 ? '#ffebee' : percentage < 50 ? '#fff8e1' : '#e8f5e9';
                                    const statusColor = percentage < 20 ? '#d32f2f' : percentage < 50 ? '#ff9800' : '#4caf50';

                                    return (
                                        <tr key={idx} style={{ background: bgColor }}>
                                            <td>{new Date(reading.date).toLocaleDateString('en-IN')}</td>
                                            <td><span style={{ color, fontWeight: '600' }}>{reading.tank}</span></td>
                                            <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace' }}>{reading.dipReading}</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontWeight: '600' }}>{liters.toLocaleString('en-IN')} L</td>
                                            <td style={{ textAlign: 'right' }}><span style={{ color: statusColor, fontWeight: '700' }}>{percentage}%</span></td>
                                            <td style={{ color: '#6c757d' }}>{reading.recordedBy || '-'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => openEditModal(reading)} style={{ padding: '4px 10px', marginRight: '8px', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#1565c0', fontWeight: '600' }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(reading.id)} style={{ padding: '4px 10px', background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#c62828', fontWeight: '600' }}>
                                                    Delete
                                                </button>
                                            </td>
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
