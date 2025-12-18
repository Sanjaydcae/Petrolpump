'use client';

import { getDailySheets, getSales, getMonthlySalesSummary, getLatestTankReadings } from '@/app/actions';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type DailyData = {
  date: string;
  salesPerson: string;
  totalSale: number;
  totalToBank: number;
  petrolSale: number;
  dieselSale: number;
  petrolAmount: number;
  dieselAmount: number;
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

      // Get all sales data for calculating liters
      const allSalesData = await getMonthlySalesSummary(currentMonth + 1, currentYear);

      // Fetch recent sales for date-wise breakdown
      const recentSales = await getSales(); // Get last 100 sales

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
            petrolAmount: 0,
            dieselAmount: 0,
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

      // Calculate petrol and diesel liters and amounts per date from sales data
      recentSales.forEach((sale: any) => {
        const dateStr = new Date(sale.date).toISOString().split('T')[0];
        if (grouped[dateStr]) {
          if (sale.product === 'Petrol') {
            grouped[dateStr].petrolSale += sale.totalSale || 0;
            grouped[dateStr].petrolAmount += sale.totalAmount || 0;
          } else if (sale.product === 'Diesel') {
            grouped[dateStr].dieselSale += sale.totalSale || 0;
            grouped[dateStr].dieselAmount += sale.totalAmount || 0;
          }
        }
      });

      // Get monthly petrol and diesel
      monthlyPetrol = allSalesData.petrolLiters;
      monthlyDiesel = allSalesData.dieselLiters;

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

        {/* TANK LEVELS - Using Tank Image */}
        <div className="pos-section" style={{ marginBottom: '30px' }}>
          <div className="pos-section-header">
            Tank Fuel Levels
            <Link href="/tank" style={{ float: 'right', fontSize: '12px', color: '#1565c0', textDecoration: 'none', fontWeight: '600' }}>
              Update Readings →
            </Link>
          </div>
          <div style={{ padding: '30px', display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
            {/* Petrol Tank */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#e65100', marginBottom: '10px' }}>⛽ PETROL TANK</div>
              <div style={{ position: 'relative', width: '300px', height: '140px' }}>
                {/* Fuel level fill (behind image) */}
                <div style={{
                  position: 'absolute',
                  bottom: '25px',
                  left: '8px',
                  right: '8px',
                  height: `${tankLevels.petrol ? Math.min(tankLevels.petrol.percentage, 100) * 0.75 : 0}px`,
                  maxHeight: '75px',
                  background: tankLevels.petrol
                    ? tankLevels.petrol.percentage < 20
                      ? 'linear-gradient(0deg, rgba(211, 47, 47, 0.85) 0%, rgba(244, 67, 54, 0.7) 100%)'
                      : tankLevels.petrol.percentage < 50
                        ? 'linear-gradient(0deg, rgba(245, 124, 0, 0.85) 0%, rgba(255, 152, 0, 0.7) 100%)'
                        : 'linear-gradient(0deg, rgba(56, 142, 60, 0.85) 0%, rgba(76, 175, 80, 0.7) 100%)'
                    : 'transparent',
                  borderRadius: '0 0 30px 30px',
                  transition: 'height 0.5s ease'
                }}></div>
                {/* Tank outline image */}
                <img src="/tank-outline.png" alt="Tank" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                {/* Percentage badge */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(255,255,255,0.95)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 2
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: tankLevels.petrol ? (tankLevels.petrol.percentage < 20 ? '#d32f2f' : tankLevels.petrol.percentage < 50 ? '#ff9800' : '#4caf50') : '#9e9e9e' }}>
                    {tankLevels.petrol ? `${tankLevels.petrol.percentage}%` : '--'}
                  </div>
                </div>
              </div>
              {tankLevels.petrol ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#ff9800' }}>
                    {tankLevels.petrol.level.toLocaleString('en-IN')} L
                  </div>
                  <div style={{ fontSize: '12px', color: '#757575' }}>of 15,000 L capacity</div>
                  <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>Updated: {new Date(tankLevels.petrol.date).toLocaleDateString('en-IN')}</div>
                </div>
              ) : (
                <div style={{ marginTop: '10px', color: '#bdbdbd' }}>No reading</div>
              )}
            </div>

            {/* Diesel Tank */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1565c0', marginBottom: '10px' }}>⛽ DIESEL TANK</div>
              <div style={{ position: 'relative', width: '300px', height: '140px' }}>
                {/* Fuel level fill (behind image) */}
                <div style={{
                  position: 'absolute',
                  bottom: '25px',
                  left: '8px',
                  right: '8px',
                  height: `${tankLevels.diesel ? Math.min(tankLevels.diesel.percentage, 100) * 0.75 : 0}px`,
                  maxHeight: '75px',
                  background: tankLevels.diesel
                    ? tankLevels.diesel.percentage < 20
                      ? 'linear-gradient(0deg, rgba(211, 47, 47, 0.85) 0%, rgba(244, 67, 54, 0.7) 100%)'
                      : tankLevels.diesel.percentage < 50
                        ? 'linear-gradient(0deg, rgba(245, 124, 0, 0.85) 0%, rgba(255, 152, 0, 0.7) 100%)'
                        : 'linear-gradient(0deg, rgba(56, 142, 60, 0.85) 0%, rgba(76, 175, 80, 0.7) 100%)'
                    : 'transparent',
                  borderRadius: '0 0 30px 30px',
                  transition: 'height 0.5s ease'
                }}></div>
                {/* Tank outline image */}
                <img src="/tank-outline.png" alt="Tank" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                {/* Percentage badge */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(255,255,255,0.95)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 2
                }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: tankLevels.diesel ? (tankLevels.diesel.percentage < 20 ? '#d32f2f' : tankLevels.diesel.percentage < 50 ? '#ff9800' : '#4caf50') : '#9e9e9e' }}>
                    {tankLevels.diesel ? `${tankLevels.diesel.percentage}%` : '--'}
                  </div>
                </div>
              </div>
              {tankLevels.diesel ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#2196f3' }}>
                    {tankLevels.diesel.level.toLocaleString('en-IN')} L
                  </div>
                  <div style={{ fontSize: '12px', color: '#757575' }}>of 20,000 L capacity</div>
                  <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>Updated: {new Date(tankLevels.diesel.date).toLocaleDateString('en-IN')}</div>
                </div>
              ) : (
                <div style={{ marginTop: '10px', color: '#bdbdbd' }}>No reading</div>
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
                <th style={{ textAlign: 'right' }}>Petrol (L)</th>
                <th style={{ textAlign: 'right' }}>Petrol Sale</th>
                <th style={{ textAlign: 'right' }}>Diesel (L)</th>
                <th style={{ textAlign: 'right' }}>Diesel Sale</th>
                <th style={{ textAlign: 'right' }}>Total Sale</th>
                <th style={{ textAlign: 'right' }}>Bank Deposit</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDays.map((day, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px' }}>{day.date}</td>
                  <td style={{ fontWeight: '500' }}>{day.salesPerson}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#ff9800', fontSize: '12px' }}>{day.petrolSale.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#ff9800' }}>₹{day.petrolAmount.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#2196f3', fontSize: '12px' }}>{day.dieselSale.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '600', color: '#2196f3' }}>₹{day.dieselAmount.toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '700' }}>₹{day.totalSale.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Consolas, Monaco, monospace', fontWeight: '700', color: '#4caf50' }}>₹{day.totalToBank.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '3px' }}>COMPLETED</span>
                  </td>
                </tr>
              ))}
              {recentDays.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', fontStyle: 'italic' }}>No recent activity found.</td>
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
