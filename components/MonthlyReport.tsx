'use client';

import { useState, useEffect } from 'react';
import { getMonthlyReportData } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Agency details (can be moved to config/env later)
const AGENCY_DETAILS = {
    name: 'KOZHANTHAVEL AGENCY',
    address: 'BPCL Petrol Pump, Main Road, Tamil Nadu',
    phone: ''
};

export default function MonthlyReport() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Export dialog state
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        salesReport: true,
        creditReport: true,
        oilLubeReport: true
    });

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const reportData = await getMonthlyReportData(month, year);
            setData(reportData);
            setIsLoading(false);
        }
        fetchData();
    }, [month, year]);

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    const exportPDF = () => {
        if (!data) return;

        // Check if at least one report type is selected
        if (!exportOptions.salesReport && !exportOptions.creditReport && !exportOptions.oilLubeReport) {
            alert('Please select at least one report to export.');
            return;
        }

        const doc = new jsPDF();
        let currentY = 15;

        // Header - Agency Name (Bold, Centered)
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(AGENCY_DETAILS.name, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += 8;

        // Address
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(AGENCY_DETAILS.address, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += 10;

        // Month and Year
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Monthly Report - ${monthName} ${year}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += 5;

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(14, currentY, doc.internal.pageSize.getWidth() - 14, currentY);
        currentY += 10;

        // Sales Summary
        if (exportOptions.salesReport) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Sales Summary', 14, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['Product', 'Total Amount (Rs.)']],
                body: [
                    ['Petrol Sales', data.totals.petrol.toLocaleString('en-IN', { minimumFractionDigits: 2 })],
                    ['Diesel Sales', data.totals.diesel.toLocaleString('en-IN', { minimumFractionDigits: 2 })],
                    ['Oil & Lube', data.totals.oilLube.toLocaleString('en-IN', { minimumFractionDigits: 2 })],
                    ['GRAND TOTAL', data.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })],
                ],
                theme: 'grid',
                headStyles: { fillColor: [33, 150, 243], fontStyle: 'bold' },
                footStyles: { fontStyle: 'bold' },
                styles: { halign: 'left' },
                columnStyles: { 1: { halign: 'right' } },
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Oil & Lube Report
        if (exportOptions.oilLubeReport && data.oilLube.length > 0) {
            const totalQty = data.oilLube.reduce((sum: number, item: any) => sum + item.quantity, 0);
            const totalAmount = data.oilLube.reduce((sum: number, item: any) => sum + item.total, 0);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Oil & Lube Report', 14, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['Product', 'Quantity', 'Price (Rs.)', 'Total (Rs.)']],
                body: data.oilLube.map((item: any) => [
                    item.name,
                    item.quantity.toString(),
                    item.price.toLocaleString('en-IN'),
                    item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                ]),
                foot: [[
                    'TOTAL',
                    totalQty.toString(),
                    '-',
                    totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                ]],
                theme: 'grid',
                headStyles: { fillColor: [255, 152, 0], fontStyle: 'bold' },
                footStyles: { fillColor: [255, 243, 224], textColor: [0, 0, 0], fontStyle: 'bold' },
                styles: { halign: 'left' },
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Credit Report
        if (exportOptions.creditReport && data.credits.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Credit Report', 14, currentY);
            currentY += 5;

            autoTable(doc, {
                startY: currentY,
                head: [['Customer Name', 'Credit Amount (Rs.)']],
                body: data.credits.map((item: any) => [
                    item.name,
                    item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                ]),
                theme: 'grid',
                headStyles: { fillColor: [211, 47, 47], fontStyle: 'bold' },
                styles: { halign: 'left' },
                columnStyles: { 1: { halign: 'right' } },
            });
        }

        // Generate filename with selected reports
        const selectedReports = [];
        if (exportOptions.salesReport) selectedReports.push('Sales');
        if (exportOptions.oilLubeReport) selectedReports.push('OilLube');
        if (exportOptions.creditReport) selectedReports.push('Credit');

        doc.save(`${AGENCY_DETAILS.name.replace(/\s+/g, '_')}_${monthName}_${year}_${selectedReports.join('_')}.pdf`);
        setShowExportDialog(false);
    };

    const toggleExportOption = (option: keyof typeof exportOptions) => {
        setExportOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };

    return (
        <div>
            {/* Export Dialog Modal */}
            {showExportDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '4px',
                        width: '400px',
                        maxWidth: '90vw',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#212529' }}>
                            Export PDF Report
                        </h3>
                        <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px' }}>
                            Select the reports you want to include in the PDF:
                        </p>

                        {/* Report Options */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                background: exportOptions.salesReport ? '#e3f2fd' : '#f8f9fa',
                                border: exportOptions.salesReport ? '2px solid #2196f3' : '1px solid #dee2e6',
                                borderRadius: '4px',
                                marginBottom: '10px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.salesReport}
                                    onChange={() => toggleExportOption('salesReport')}
                                    style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#2196f3' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#212529' }}>Sales Report</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Petrol, Diesel & Grand Total</div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                background: exportOptions.oilLubeReport ? '#fff3e0' : '#f8f9fa',
                                border: exportOptions.oilLubeReport ? '2px solid #ff9800' : '1px solid #dee2e6',
                                borderRadius: '4px',
                                marginBottom: '10px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.oilLubeReport}
                                    onChange={() => toggleExportOption('oilLubeReport')}
                                    style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#ff9800' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#212529' }}>Oil & Lube Report</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Product-wise breakdown</div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                background: exportOptions.creditReport ? '#ffebee' : '#f8f9fa',
                                border: exportOptions.creditReport ? '2px solid #d32f2f' : '1px solid #dee2e6',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={exportOptions.creditReport}
                                    onChange={() => toggleExportOption('creditReport')}
                                    style={{ marginRight: '12px', width: '18px', height: '18px', accentColor: '#d32f2f' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#212529' }}>Credit Report</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Customer credits outstanding</div>
                                </div>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowExportDialog(false)}
                                className="pos-btn"
                                style={{
                                    background: '#f8f9fa',
                                    color: '#495057',
                                    border: '1px solid #dee2e6'
                                }}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={exportPDF}
                                className="pos-btn pos-btn-primary"
                            >
                                EXPORT PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Section */}
            <div className="pos-section" style={{ marginBottom: '20px' }}>
                <div className="pos-section-header">
                    Report Filters
                    <span style={{ float: 'right' }}>
                        <button
                            onClick={() => setShowExportDialog(true)}
                            disabled={!data || isLoading}
                            className="pos-btn pos-btn-primary"
                            style={{ padding: '8px 16px', fontSize: '12px' }}
                        >
                            Export PDF
                        </button>
                    </span>
                </div>
                <div style={{ padding: '16px', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                    <div>
                        <label className="pos-label">Month</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="pos-input"
                            style={{ width: '160px' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="pos-label">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="pos-input"
                            style={{ width: '120px' }}
                        >
                            {[2024, 2025, 2026].map(y => (<option key={y} value={y}>{y}</option>))}
                        </select>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#6c757d' }}>
                        Showing: <strong style={{ color: '#1565c0' }}>{monthName} {year}</strong>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#2196f3' }} />
                </div>
            ) : data ? (
                <div className="pos-grid-2">

                    {/* Sales Summary */}
                    <div className="pos-section">
                        <div className="pos-section-header">
                            Sales Summary
                            <span style={{ float: 'right', fontWeight: '700', color: '#4caf50' }}>
                                ₹{data.totals.grandTotal.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <table className="pos-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <span className="nozzle-petrol">Petrol Sales</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="pos-value">₹{data.totals.petrol.toLocaleString('en-IN')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="nozzle-diesel">Diesel Sales</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="pos-value">₹{data.totals.diesel.toLocaleString('en-IN')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Oil & Lube</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="pos-value" style={{ color: '#ff9800' }}>₹{data.totals.oilLube.toLocaleString('en-IN')}</span>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <td style={{ fontWeight: '700', fontSize: '14px' }}>GRAND TOTAL</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="pos-value" style={{ color: '#4caf50', fontSize: '18px' }}>₹{data.totals.grandTotal.toLocaleString('en-IN')}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Credit Report */}
                    <div className="pos-section">
                        <div className="pos-section-header">
                            Credit Report
                            <span style={{ float: 'right', fontWeight: '700', color: '#d32f2f' }}>
                                ₹{data.credits.reduce((sum: number, c: any) => sum + c.amount, 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                            <table className="pos-table">
                                <thead>
                                    <tr>
                                        <th>Customer Name</th>
                                        <th style={{ textAlign: 'right' }}>Credit Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.credits.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#adb5bd', fontStyle: 'italic' }}>
                                                No credit sales this month
                                            </td>
                                        </tr>
                                    ) : (
                                        data.credits.map((c: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '500' }}>{c.name}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="pos-value" style={{ color: '#d32f2f' }}>₹{c.amount.toLocaleString('en-IN')}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Oil & Lube Report - Full Width */}
                    <div className="pos-section" style={{ gridColumn: '1 / -1' }}>
                        <div className="pos-section-header">
                            Oil & Lube Report
                            <span style={{ float: 'right', fontWeight: '700', color: '#ff9800' }}>
                                Total: ₹{data.totals.oilLube.toLocaleString('en-IN')} | {data.oilLube.reduce((sum: number, o: any) => sum + o.quantity, 0)} items sold
                            </span>
                        </div>
                        <table className="pos-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th style={{ textAlign: 'center' }}>Qty Sold</th>
                                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.oilLube.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#adb5bd', fontStyle: 'italic' }}>
                                            No oil & lube sales this month
                                        </td>
                                    </tr>
                                ) : (
                                    data.oilLube.map((o: any, i: number) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: '500' }}>{o.name}</td>
                                            <td style={{ textAlign: 'center', fontWeight: '600', color: '#2196f3' }}>{o.quantity}</td>
                                            <td style={{ textAlign: 'right', color: '#6c757d' }}>₹{o.price.toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="pos-value" style={{ color: '#ff9800' }}>₹{o.total.toLocaleString('en-IN')}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data.oilLube.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: '#fff3e0', fontWeight: '700' }}>
                                        <td>TOTAL</td>
                                        <td style={{ textAlign: 'center', color: '#2196f3' }}>
                                            {data.oilLube.reduce((sum: number, o: any) => sum + o.quantity, 0)} items
                                        </td>
                                        <td style={{ textAlign: 'right' }}>-</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ color: '#ff9800', fontSize: '16px' }}>₹{data.totals.oilLube.toLocaleString('en-IN')}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                </div>
            ) : null}
        </div>
    );
}
