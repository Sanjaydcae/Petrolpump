'use client';

import SaleForm from '@/components/SaleForm';
import { useState } from 'react';

export default function SalePage() {
    const [activePump, setActivePump] = useState(1);

    return (
        <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px 20px' }}>
            <div className="pos-container">

                {/* Header with Pump Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#212529' }}>
                            Daily Sales Entry
                        </h1>
                        <p style={{ color: '#6c757d', fontSize: '14px' }}>
                            Enter nozzle readings and sales data
                        </p>
                    </div>

                    {/* Pump Tabs */}
                    <div style={{ display: 'flex', background: '#f8f9fa', padding: '4px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <button
                            onClick={() => setActivePump(1)}
                            style={{
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '3px',
                                border: 'none',
                                cursor: 'pointer',
                                background: activePump === 1 ? '#2196f3' : 'transparent',
                                color: activePump === 1 ? '#ffffff' : '#6c757d',
                                transition: 'all 0.2s'
                            }}
                        >
                            PUMP 1
                        </button>
                        <button
                            onClick={() => setActivePump(2)}
                            style={{
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '3px',
                                border: 'none',
                                cursor: 'pointer',
                                background: activePump === 2 ? '#ff9800' : 'transparent',
                                color: activePump === 2 ? '#ffffff' : '#6c757d',
                                transition: 'all 0.2s'
                            }}
                        >
                            PUMP 2
                        </button>
                    </div>
                </div>

                {/* Active Pump Indicator */}
                <div style={{
                    background: activePump === 1 ? '#e3f2fd' : '#fff3e0',
                    borderLeft: `4px solid ${activePump === 1 ? '#2196f3' : '#ff9800'}`,
                    padding: '12px 16px',
                    marginBottom: '20px',
                    borderRadius: '0 4px 4px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: activePump === 1 ? '#1565c0' : '#e65100'
                }}>
                    Currently editing: Pump {activePump}
                </div>

                <div key={activePump}>
                    <SaleForm pumpId={activePump} />
                </div>
            </div>
        </main>
    );
}
