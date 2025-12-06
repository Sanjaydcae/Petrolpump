'use client';

import { saveDailySheet, getDailySheetByDate } from '@/app/actions';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type NozzleData = {
    nozzle: string;
    product: 'Petrol' | 'Diesel';
    openReading: string;
    closeReading: string;
    testing: string;
    totalSale: number;
    totalAmount: number;
};

type CreditEntry = {
    name: string;
    amount: string;
};

type OilLubeProduct = {
    name: string;
    size: string;
    price: number;
    quantity: string;
    total: number;
};

export default function SaleForm({ pumpId = 1 }: { pumpId?: number }) {
    const searchParams = useSearchParams();
    const urlDate = searchParams.get('date');

    const [isPending, setIsPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [date, setDate] = useState(urlDate || new Date().toISOString().split('T')[0]);
    const [salesPerson, setSalesPerson] = useState('');
    const [petrolRate, setPetrolRate] = useState('');
    const [dieselRate, setDieselRate] = useState('');

    const [nozzles, setNozzles] = useState<NozzleData[]>([
        { nozzle: 'A1', product: 'Petrol', openReading: '', closeReading: '', testing: '', totalSale: 0, totalAmount: 0 },
        { nozzle: 'A2', product: 'Diesel', openReading: '', closeReading: '', testing: '', totalSale: 0, totalAmount: 0 },
        { nozzle: 'B1', product: 'Petrol', openReading: '', closeReading: '', testing: '', totalSale: 0, totalAmount: 0 },
        { nozzle: 'B2', product: 'Diesel', openReading: '', closeReading: '', testing: '', totalSale: 0, totalAmount: 0 },
    ]);

    const [creditEntries, setCreditEntries] = useState<CreditEntry[]>([
        { name: '', amount: '' },
        { name: '', amount: '' },
        { name: '', amount: '' },
        { name: '', amount: '' },
        { name: '', amount: '' },
    ]);

    const [oilLubeProducts, setOilLubeProducts] = useState<OilLubeProduct[]>([
        { name: 'OIL', size: '20ML', price: 10, quantity: '', total: 0 },
        { name: 'OIL', size: '40ML', price: 17, quantity: '', total: 0 },
        { name: 'OIL', size: '60ML', price: 25, quantity: '', total: 0 },
        { name: 'LUBE 20-40', size: '1L', price: 370, quantity: '', total: 0 },
        { name: 'LUBE 10-30', size: '1L', price: 350, quantity: '', total: 0 },
        { name: 'LUBE 10-30', size: '800ml', price: 310, quantity: '', total: 0 },
        { name: 'LUBE 5-30', size: '3.5L', price: 1650, quantity: '', total: 0 },
        { name: 'LUBE 15-40', size: '5L', price: 1600, quantity: '', total: 0 },
        { name: 'LUBE 20-40', size: '7.5L', price: 2400, quantity: '', total: 0 },
        { name: 'DISTILLED WATER', size: '1L', price: 20, quantity: '', total: 0 },
        { name: 'HYDRAULIC OIL', size: '5L', price: 1100, quantity: '', total: 0 },
        { name: 'LUBE 15-40', size: '3.5L', price: 1050, quantity: '', total: 0 },
        { name: 'ADBLUE', size: '10L', price: 800, quantity: '', total: 0 },
    ]);

    const [paytm, setPaytm] = useState('');
    const [card, setCard] = useState('');
    const [fleatCard, setFleatCard] = useState('');
    const [nightCash, setNightCash] = useState('');

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const data = await getDailySheetByDate(date, pumpId);
            if (data) {
                setSalesPerson(data.salesPerson || '');
                if (data.nozzleSales && data.nozzleSales.length > 0) {
                    const petrolSale = data.nozzleSales.find((n: any) => n.product === 'Petrol');
                    const dieselSale = data.nozzleSales.find((n: any) => n.product === 'Diesel');
                    if (petrolSale) setPetrolRate(petrolSale.rate.toString());
                    if (dieselSale) setDieselRate(dieselSale.rate.toString());
                }
                if (data.nozzleSales) {
                    setNozzles(prev => prev.map(n => {
                        const found = data.nozzleSales.find((s: any) => s.nozzle === n.nozzle);
                        return found ? { ...n, openReading: found.openReading.toString(), closeReading: found.closeReading.toString(), testing: found.testing.toString(), totalSale: found.totalSale, totalAmount: found.totalAmount } : n;
                    }));
                }
                if (data.creditSales) {
                    const loadedCredits = data.creditSales.map((c: any) => ({ name: c.customerName, amount: c.amount.toString() }));
                    while (loadedCredits.length < 5) loadedCredits.push({ name: '', amount: '' });
                    setCreditEntries(loadedCredits);
                }
                if (data.oilLubeSales) {
                    setOilLubeProducts(prev => prev.map(p => {
                        const found = data.oilLubeSales.find((s: any) => s.productName === `${p.name} ${p.size}`.trim());
                        return found ? { ...p, quantity: found.quantity.toString(), total: found.total } : { ...p, quantity: '', total: 0 };
                    }));
                }
                setPaytm(data.paytmAmount?.toString() || '');
                setCard(data.cardAmount?.toString() || '');
                setFleatCard(data.fleatCardAmount?.toString() || '');
                setNightCash(data.nightCashAmount?.toString() || '');
            } else {
                // No data for this pump - try to get rates from Pump 1 for same day
                const pump1Data = pumpId !== 1 ? await getDailySheetByDate(date, 1) : null;
                if (pump1Data && pump1Data.nozzleSales && pump1Data.nozzleSales.length > 0) {
                    const petrolSale = pump1Data.nozzleSales.find((n: any) => n.product === 'Petrol');
                    const dieselSale = pump1Data.nozzleSales.find((n: any) => n.product === 'Diesel');
                    if (petrolSale) setPetrolRate(petrolSale.rate.toString());
                    if (dieselSale) setDieselRate(dieselSale.rate.toString());
                    setSalesPerson(pump1Data.salesPerson || '');
                } else {
                    setSalesPerson(''); setPetrolRate(''); setDieselRate('');
                }

                // Get previous day's closing as today's opening
                const prevDate = new Date(date);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevDateStr = prevDate.toISOString().split('T')[0];
                const prevDayData = await getDailySheetByDate(prevDateStr, pumpId);

                if (prevDayData && prevDayData.nozzleSales && prevDayData.nozzleSales.length > 0) {
                    // Use previous day's closing as today's opening
                    setNozzles(prev => prev.map(n => {
                        const prevNozzle = prevDayData.nozzleSales.find((s: any) => s.nozzle === n.nozzle);
                        return prevNozzle
                            ? { ...n, openReading: prevNozzle.closeReading.toString(), closeReading: '', testing: '', totalSale: 0, totalAmount: 0 }
                            : { ...n, openReading: '', closeReading: '', testing: '', totalSale: 0, totalAmount: 0 };
                    }));
                } else {
                    setNozzles(prev => prev.map(n => ({ ...n, openReading: '', closeReading: '', testing: '', totalSale: 0, totalAmount: 0 })));
                }

                setCreditEntries(Array(5).fill(null).map(() => ({ name: '', amount: '' })));
                setOilLubeProducts(prev => prev.map(p => ({ ...p, quantity: '', total: 0 })));
                setPaytm(''); setCard(''); setFleatCard(''); setNightCash('');
            }
            setIsLoading(false);
        }
        fetchData();
    }, [date, pumpId]);

    const updateNozzle = (index: number, field: keyof NozzleData, value: string) => {
        const updated = [...nozzles];
        updated[index] = { ...updated[index], [field]: value };
        const open = parseFloat(updated[index].openReading) || 0;
        const close = parseFloat(updated[index].closeReading) || 0;
        const test = parseFloat(updated[index].testing) || 0;
        const rate = parseFloat(updated[index].product === 'Petrol' ? petrolRate : dieselRate) || 0;
        updated[index].totalSale = Math.max(0, close - open - test);
        updated[index].totalAmount = updated[index].totalSale * rate;
        setNozzles(updated);
    };

    const handleRateChange = (type: 'Petrol' | 'Diesel', value: string) => {
        if (type === 'Petrol') setPetrolRate(value); else setDieselRate(value);
        const rate = parseFloat(value) || 0;
        setNozzles(nozzles.map(n => n.product === type ? { ...n, totalAmount: n.totalSale * rate } : n));
    };

    const updateCreditEntry = (index: number, field: keyof CreditEntry, value: string) => {
        const updated = [...creditEntries];
        updated[index] = { ...updated[index], [field]: value };
        setCreditEntries(updated);
    };

    const updateOilLube = (index: number, quantity: string) => {
        const updated = [...oilLubeProducts];
        updated[index].quantity = quantity;
        updated[index].total = (parseFloat(quantity) || 0) * updated[index].price;
        setOilLubeProducts(updated);
    };

    const totalNozzleSales = nozzles.reduce((sum, n) => sum + n.totalAmount, 0);
    const totalCreditSales = creditEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalOilLube = oilLubeProducts.reduce((sum, p) => sum + p.total, 0);
    const totalCardPaytm = (parseFloat(paytm) || 0) + (parseFloat(card) || 0) + (parseFloat(fleatCard) || 0);
    const totalNightCash = parseFloat(nightCash) || 0;
    const grandTotal = totalNozzleSales + totalOilLube;
    const totalToBank = grandTotal - (totalCardPaytm + totalCreditSales + totalNightCash);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsPending(true);
        const dailySheetData = {
            date, pumpId, salesPerson,
            petrolRate: parseFloat(petrolRate) || 0,
            dieselRate: parseFloat(dieselRate) || 0,
            nozzles: nozzles.filter(n => n.openReading && n.closeReading),
            creditSales: creditEntries.filter(e => e.name && e.amount),
            oilLubeSales: oilLubeProducts.filter(p => parseFloat(p.quantity) > 0),
            paymentMethods: { paytm: parseFloat(paytm) || 0, card: parseFloat(card) || 0, fleatCard: parseFloat(fleatCard) || 0, credit: totalCreditSales, nightCash: totalNightCash },
            totals: { totalNozzleSales, totalCreditSales, totalOilLube, totalToBank }
        };
        const result = await saveDailySheet(dailySheetData);
        setIsPending(false);
        if (result?.error) alert(result.error);
        else alert(result?.message || 'Daily sheet saved successfully!');
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
            <form onSubmit={handleSubmit} className="pos-container">

                {/* HEADER */}
                <div className="pos-header">
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Daily Sales Entry</h1>
                        <div style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                            Pump #{pumpId} • {date}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div>
                            <label className="pos-label">Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pos-input" style={{ width: '160px' }} />
                        </div>
                        <div>
                            <label className="pos-label">Sales Person</label>
                            <input type="text" value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} className="pos-input" style={{ width: '200px' }} placeholder="Enter name" />
                        </div>
                    </div>
                </div>

                {/* RATES BAR */}
                <div className="pos-grid-2" style={{ marginBottom: '20px' }}>
                    <div className="pos-card" style={{ borderLeft: '4px solid #ff9800' }}>
                        <label className="pos-label">Petrol Rate (₹/Liter)</label>
                        <input type="number" step="0.01" value={petrolRate} onChange={(e) => handleRateChange('Petrol', e.target.value)} className="pos-input pos-input-large" placeholder="0.00" />
                    </div>
                    <div className="pos-card" style={{ borderLeft: '4px solid #2196f3' }}>
                        <label className="pos-label">Diesel Rate (₹/Liter)</label>
                        <input type="number" step="0.01" value={dieselRate} onChange={(e) => handleRateChange('Diesel', e.target.value)} className="pos-input pos-input-large" placeholder="0.00" />
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="pos-grid-3">

                    {/* PUMP SALES */}
                    <div className="pos-section">
                        <div className="pos-section-header">
                            Pump Sales
                            <span style={{ float: 'right', fontWeight: '700', color: '#1565c0' }}>₹{totalNozzleSales.toLocaleString('en-IN')}</span>
                        </div>
                        <table className="pos-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>Nozzle</th>
                                    <th>Opening</th>
                                    <th>Closing</th>
                                    <th style={{ width: '80px' }}>Testing</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nozzles.map((n, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <span className={n.product === 'Petrol' ? 'nozzle-petrol' : 'nozzle-diesel'}>{n.nozzle}</span>
                                            <div style={{ fontSize: '10px', color: '#6c757d' }}>{n.product}</div>
                                        </td>
                                        <td><input type="number" value={n.openReading} onChange={(e) => updateNozzle(idx, 'openReading', e.target.value)} className="pos-input" style={{ minWidth: '180px', fontSize: '15px' }} placeholder="0" /></td>
                                        <td><input type="number" value={n.closeReading} onChange={(e) => updateNozzle(idx, 'closeReading', e.target.value)} className="pos-input" style={{ minWidth: '180px', fontSize: '15px' }} placeholder="0" /></td>
                                        <td><input type="number" value={n.testing} onChange={(e) => updateNozzle(idx, 'testing', e.target.value)} className="pos-input" style={{ width: '70px' }} placeholder="0" /></td>
                                        <td style={{ textAlign: 'right', minWidth: '130px' }}><span className="pos-value" style={{ fontSize: '15px' }}>₹{n.totalAmount.toLocaleString('en-IN')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* CREDIT & PAYMENTS */}
                    <div>
                        {/* CREDIT SALES */}
                        <div className="pos-section" style={{ marginBottom: '20px' }}>
                            <div className="pos-section-header">
                                Credit Sales
                                <span style={{ float: 'right', fontWeight: '700', color: '#1565c0' }}>₹{totalCreditSales.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ padding: '12px' }}>
                                {creditEntries.map((entry, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', marginBottom: '8px' }}>
                                        <input type="text" value={entry.name} onChange={(e) => updateCreditEntry(idx, 'name', e.target.value)} className="pos-input" placeholder="Customer Name" />
                                        <input type="number" value={entry.amount} onChange={(e) => updateCreditEntry(idx, 'amount', e.target.value)} className="pos-input" placeholder="₹0" style={{ textAlign: 'right' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PAYMENTS */}
                        <div className="pos-section">
                            <div className="pos-section-header">Digital Payments</div>
                            <div style={{ padding: '12px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <label className="pos-label">Paytm</label>
                                    <input type="number" value={paytm} onChange={(e) => setPaytm(e.target.value)} className="pos-input" placeholder="₹0" style={{ textAlign: 'right' }} />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <label className="pos-label">Card</label>
                                    <input type="number" value={card} onChange={(e) => setCard(e.target.value)} className="pos-input" placeholder="₹0" style={{ textAlign: 'right' }} />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <label className="pos-label">Fleet Card</label>
                                    <input type="number" value={fleatCard} onChange={(e) => setFleatCard(e.target.value)} className="pos-input" placeholder="₹0" style={{ textAlign: 'right' }} />
                                </div>
                                <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '12px', marginTop: '12px' }}>
                                    <label className="pos-label" style={{ color: '#d32f2f' }}>Night Cash</label>
                                    <input type="number" value={nightCash} onChange={(e) => setNightCash(e.target.value)} className="pos-input" placeholder="₹0" style={{ textAlign: 'right' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OIL & LUBE */}
                    <div className="pos-section">
                        <div className="pos-section-header">
                            Oil & Lube Products
                            <span style={{ float: 'right', fontWeight: '700', color: '#1565c0' }}>₹{totalOilLube.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                            <table className="pos-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style={{ width: '70px' }}>Size</th>
                                        <th style={{ width: '70px', textAlign: 'center' }}>Price</th>
                                        <th style={{ width: '70px', textAlign: 'center' }}>Qty</th>
                                        <th style={{ width: '90px', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {oilLubeProducts.map((p, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '500' }}>{p.name}</td>
                                            <td style={{ fontSize: '12px', color: '#6c757d' }}>{p.size}</td>
                                            <td style={{ textAlign: 'center', fontSize: '13px' }}>₹{p.price}</td>
                                            <td style={{ padding: '4px' }}>
                                                <input type="number" value={p.quantity} onChange={(e) => updateOilLube(idx, e.target.value)} className="pos-input" placeholder="-" style={{ textAlign: 'center', padding: '6px' }} />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="pos-value" style={{ color: p.total > 0 ? '#ff9800' : '#adb5bd' }}>
                                                    {p.total > 0 ? `₹${p.total}` : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* SUMMARY */}
                <div className="pos-summary" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div>
                            <div className="pos-summary-row">
                                <span className="pos-summary-label">Pump Sales:</span>
                                <span className="pos-summary-value">₹{totalNozzleSales.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pos-summary-row">
                                <span className="pos-summary-label">Oil & Lube:</span>
                                <span className="pos-summary-value" style={{ color: '#ff9800' }}>+ ₹{totalOilLube.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pos-summary-row total">
                                <span className="pos-summary-label">GRAND TOTAL:</span>
                                <span className="pos-summary-value">₹{grandTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div>
                            <div className="pos-summary-row">
                                <span className="pos-summary-label">Credit Sales:</span>
                                <span className="pos-summary-value" style={{ color: '#d32f2f' }}>- ₹{totalCreditSales.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pos-summary-row">
                                <span className="pos-summary-label">Digital Payments:</span>
                                <span className="pos-summary-value" style={{ color: '#d32f2f' }}>- ₹{totalCardPaytm.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pos-summary-row">
                                <span className="pos-summary-label">Night Cash:</span>
                                <span className="pos-summary-value" style={{ color: '#d32f2f' }}>- ₹{totalNightCash.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="pos-summary-row total" style={{ borderTop: '3px solid #4caf50', color: '#4caf50' }}>
                                <span className="pos-summary-label">CASH TO BANK:</span>
                                <span className="pos-summary-value" style={{ fontSize: '22px' }}>₹{totalToBank.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button type="submit" disabled={isPending} className="pos-btn pos-btn-primary" style={{ fontSize: '16px', padding: '16px 48px' }}>
                        {isPending ? 'SAVING...' : 'SAVE DAILY SHEET'}
                    </button>
                </div>

            </form>
        </div>
    );
}
