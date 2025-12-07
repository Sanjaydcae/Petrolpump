'use client';

import { getDailySheets, getMonthlySalesSummary, getLatestTankReadings } from '@/app/actions';
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
  const [tankLevels, setTankLevels] = useState<{ petrol: any; diesel: any }>({ petrol: null, diesel: null });

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

      // Load tank levels
      const tanks = await getLatestTankReadings();
      setTankLevels(tanks);
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

        {/* TANK LEVELS - Visual Tank Gauges */}
        <div className="pos-section" style={{ marginBottom: '30px' }}>
          <div className="pos-section-header">
            Tank Fuel Levels
            <Link href="/tank" style={{ float: 'right', fontSize: '12px', color: '#1565c0', textDecoration: 'none', fontWeight: '600' }}>
              Update Readings →
            </Link>
          </div>
          <div style={{ padding: '30px', display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
            {/* Petrol Tank Visual */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#e65100', marginBottom: '10px' }}>⛽ PETROL</div>
              <div style={{ position: 'relative', width: '120px', height: '180px', margin: '0 auto' }}>
                {/* Tank SVG */}
                <svg viewBox="0 0 100 150" style={{ width: '100%', height: '100%' }}>
                  {/* Tank outline */}
                  <defs>
                    <linearGradient id="petrolGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#ff9800', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#f57c00', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="petrolLow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#f44336', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#d32f2f', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="petrolMed" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#ffc107', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#ff9800', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="petrolHigh" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#4caf50', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#388e3c', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Tank body */}
                  <rect x="10" y="20" width="80" height="120" rx="10" fill="#f5f5f5" stroke="#bdbdbd" strokeWidth="3" />
                  {/* Fuel level */}
                  {tankLevels.petrol && (
                    <rect
                      x="13"
                      y={20 + 117 - (117 * Math.min(tankLevels.petrol.percentage, 100) / 100)}
                      width="74"
                      height={117 * Math.min(tankLevels.petrol.percentage, 100) / 100}
                      rx="7"
                      fill={tankLevels.petrol.percentage < 20 ? 'url(#petrolLow)' : tankLevels.petrol.percentage < 50 ? 'url(#petrolMed)' : 'url(#petrolHigh)'}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  )}
                  {/* Tank cap */}
                  <rect x="35" y="5" width="30" height="18" rx="5" fill="#757575" />
                  {/* Level lines */}
                  <line x1="85" y1="35" x2="95" y2="35" stroke="#9e9e9e" strokeWidth="1" />
                  <text x="97" y="38" fontSize="8" fill="#757575">100%</text>
                  <line x1="85" y1="75" x2="95" y2="75" stroke="#9e9e9e" strokeWidth="1" />
                  <text x="97" y="78" fontSize="8" fill="#757575">50%</text>
                  <line x1="85" y1="115" x2="95" y2="115" stroke="#9e9e9e" strokeWidth="1" />
                  <text x="97" y="118" fontSize="8" fill="#757575">20%</text>
                </svg>
              </div>
              {tankLevels.petrol ? (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: tankLevels.petrol.percentage < 20 ? '#d32f2f' : tankLevels.petrol.percentage < 50 ? '#ff9800' : '#4caf50' }}>
                    {tankLevels.petrol.percentage}%
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#ff9800' }}>{tankLevels.petrol.level.toLocaleString('en-IN')} L</div>
                  <div style={{ fontSize: '11px', color: '#9e9e9e' }}>of 15,000 L</div>
                  <div style={{ fontSize: '10px', color: '#bdbdbd', marginTop: '4px' }}>Updated: {new Date(tankLevels.petrol.date).toLocaleDateString('en-IN')}</div>
                </div>
              ) : (
                <div style={{ marginTop: '15px', color: '#bdbdbd' }}>No reading</div>
              )}
            </div>

            {/* Diesel Tank Visual */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1565c0', marginBottom: '10px' }}>⛽ DIESEL</div>
              <div style={{ position: 'relative', width: '120px', height: '180px', margin: '0 auto' }}>
                {/* Tank SVG */}
                <svg viewBox="0 0 100 150" style={{ width: '100%', height: '100%' }}>
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="dieselLow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#f44336', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#d32f2f', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="dieselMed" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#ffc107', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#ff9800', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="dieselHigh" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#4caf50', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#388e3c', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Tank body */}
                  <rect x="10" y="20" width="80" height="120" rx="10" fill="#f5f5f5" stroke="#bdbdbd" strokeWidth="3" />
                  {/* Fuel level */}
                  {tankLevels.diesel && (
                    <rect
                      x="13"
                      y={20 + 117 - (117 * Math.min(tankLevels.diesel.percentage, 100) / 100)}
                      width="74"
                      height={117 * Math.min(tankLevels.diesel.percentage, 100) / 100}
                      rx="7"
                      fill={tankLevels.diesel.percentage < 20 ? 'url(#dieselLow)' : tankLevels.diesel.percentage < 50 ? 'url(#dieselMed)' : 'url(#dieselHigh)'}
                      style={{ transition: 'all 0.5s ease' }}
                    />
                  )}
                  {/* Tank cap */}
                  <rect x="35" y="5" width="30" height="18" rx="5" fill="#757575" />
                  {/* Level lines */}
                  <line x1="85" y1="35" x2="95" y2="35" stroke="#9e9e9e" strokeWidth="1" />
                  <text x="97" y="38" fontSize="8" fill="#757575">100%</text>
                  <line x1="85" y1="75" x2="95" y2="75" stroke="#9e9e9e" strokeWidth="1" />
                  <text x="97" y="78" fontSize="8" fill="#757575">50%</text>
                  <line x1="85" y1="115" x2="95" y2="115" stroke="#9e9e9e" strokeWidth="1" />
                  <text x="97" y="118" fontSize="8" fill="#757575">20%</text>
                </svg>
              </div>
              {tankLevels.diesel ? (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: tankLevels.diesel.percentage < 20 ? '#d32f2f' : tankLevels.diesel.percentage < 50 ? '#ff9800' : '#4caf50' }}>
                    {tankLevels.diesel.percentage}%
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#2196f3' }}>{tankLevels.diesel.level.toLocaleString('en-IN')} L</div>
                  <div style={{ fontSize: '11px', color: '#9e9e9e' }}>of 20,000 L</div>
                  <div style={{ fontSize: '10px', color: '#bdbdbd', marginTop: '4px' }}>Updated: {new Date(tankLevels.diesel.date).toLocaleDateString('en-IN')}</div>
                </div>
              ) : (
                <div style={{ marginTop: '15px', color: '#bdbdbd' }}>No reading</div>
              )}
            </div>
          </div>
        </div>
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
