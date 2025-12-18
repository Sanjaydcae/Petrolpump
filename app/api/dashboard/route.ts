import { NextResponse } from 'next/server';
import { getDailySheets, getMonthlySalesSummary } from '@/app/actions';

export async function GET() {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const todayStr = today.toISOString().split('T')[0];

        // Get all daily sheets
        const sheets = await getDailySheets();

        // Calculate today's sale
        const todaySale = sheets
            .filter((s: any) => {
                const dateStr = new Date(s.date).toISOString().split('T')[0];
                return dateStr === todayStr;
            })
            .reduce((sum, s: any) => sum + (s.totalNozzleSales || 0), 0);

        // Calculate monthly revenue
        const monthlyRevenue = sheets
            .filter((s: any) => {
                const d = new Date(s.date);
                return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            })
            .reduce((sum, s: any) => sum + (s.totalNozzleSales || 0), 0);

        // Get product sales breakdown
        const productSales = await getMonthlySalesSummary(currentMonth, currentYear);

        return NextResponse.json({
            todaySale,
            monthlyRevenue,
            monthlyPetrol: productSales.petrolLiters,
            monthlyDiesel: productSales.dieselLiters,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
