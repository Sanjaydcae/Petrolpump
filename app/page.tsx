'use client';

import { getDailySheets, getMonthlySalesSummary } from '@/app/actions';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type DailyData = {
  date: string;
  salesPerson: string;
  totalSale: number;
  totalToBank: number;
  petrolSale: number;
  dieselSale: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyPetrol: 0,
    monthlyDiesel: 0,
    creditPending: 0,
    todaySale: 0
  });
  const [recentDays, setRecentDays] = useState<DailyData[]>([]);

  useEffect(() => {
    async function loadData() {
      const sheets = await getDailySheets();
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const todayStr = today.toISOString().split('T')[0];

      // Group sheets by date and combine Pump 1 + Pump 2
      const grouped: Record<string, DailyData> = {};
      let monthlyRevenue = 0;
      let monthlyPetrol = 0;
      let monthlyDiesel = 0;
      let todaySale = 0;

      sheets.forEach((sheet: any) => {
        const dateObj = new Date(sheet.date);
        const dateStr = dateObj.toISOString().split('T')[0];

        if (!grouped[dateStr]) {
          grouped[dateStr] = {
            date: dateStr,
            salesPerson: sheet.salesPerson || '-',
            totalSale: 0,
            totalToBank: 0,
            petrolSale: 0,
            dieselSale: 0,
          };
        }

        // Add totals from both pumps
        grouped[dateStr].totalSale += sheet.totalNozzleSales || 0;
        grouped[dateStr].totalToBank += sheet.totalToBank || 0;

        // Track monthly totals
        if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
          monthlyRevenue += sheet.totalNozzleSales || 0;
        }

        // Track today's sale
        if (dateStr === todayStr) {
          todaySale += sheet.totalNozzleSales || 0;
        }
      });

      // Get petrol and diesel breakdown (in liters)
      const productSales = await getMonthlySalesSummary(today.getMonth() + 1, today.getFullYear());
      monthlyPetrol = productSales.petrolLiters;
      monthlyDiesel = productSales.dieselLiters;

      // Sort by date descending and take first 5
      const sortedDays = Object.values(grouped)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setRecentDays(sortedDays);
      setStats({
        monthlyRevenue,
        monthlyPetrol,
        monthlyDiesel,
        creditPending: 0,
        todaySale
      });
    }
    loadData();
  }, []);

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f5', padding: '30px 20px' }}>
      <div className="pos-container">

        {/* HEADER */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#212529' }}>Dashboard</h1>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>Overview of your petrol pump operations</p>
        </div>

        {/* KPI GRID */}
        <div className="pos-grid-2" style={{ marginBottom: '30px' }}>
          <div className="pos-card" style={{ borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Today's Revenue (All Pumps)</div>
            <div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace' }}>₹{stats.todaySale.toLocaleString('en-IN')}</div>
          </div>

          <div className="pos-card" style={{ borderLeft: '4px solid #2196f3' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{currentMonth} Revenue</div>
            <div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace' }}>₹{stats.monthlyRevenue.toLocaleString('en-IN')}</div>
          </div>

          <div className="pos-card" style={{ borderLeft: '4px solid #ff9800' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Petrol Sold ({currentMonth})</div>
            <div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#ff9800' }}>{stats.monthlyPetrol.toLocaleString('en-IN', { minimumFractionDigits: 2 })} L</div>
          </div>

          <div className="pos-card" style={{ borderLeft: '4px solid #03a9f4' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Diesel Sold ({currentMonth})</div>
            <div style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'Consolas, Monaco, monospace', color: '#03a9f4' }}>{stats.monthlyDiesel.toLocaleString('en-IN', { minimumFractionDigits: 2 })} L</div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="pos-section">
          <div className="pos-section-header">
            Recent Daily Sheets (Combined Pump 1 + Pump 2)
            <Link href="/report" style={{ float: 'right', fontSize: '12px', color: '#1565c0', textDecoration: 'none', fontWeight: '600' }}>
              View All →
            </Link>
          </div>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sales Person</th>
                <th style={{ textAlign: 'right' }}>Total Sale (P1+P2)</th>
                <th style={{ textAlign: 'right' }}>Bank Deposit</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDays.map((day, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px' }}>{day.date}</td>
                  <td style={{ fontWeight: '500' }}>{day.salesPerson}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600' }}>₹{day.totalSale.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '700', color: '#4caf50' }}>₹{day.totalToBank.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '3px' }}>COMPLETED</span>
                  </td>
                </tr>
              ))}
              {recentDays.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', fontStyle: 'italic' }}>No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* QUICK ACTIONS */}
        <div className="pos-grid-2" style={{ marginTop: '30px' }}>
          <Link href="/sale" className="pos-card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #4caf50', cursor: 'pointer' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#212529' }}>Create New Daily Entry</div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>Record pump readings and sales data</div>
          </Link>
          <Link href="/report" className="pos-card" style={{ textDecoration: 'none', color: 'inherit', borderLeft: '4px solid #2196f3', cursor: 'pointer' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#212529' }}>View Reports</div>
            <div style={{ fontSize: '13px', color: '#6c757d' }}>Access daily and monthly summaries</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
