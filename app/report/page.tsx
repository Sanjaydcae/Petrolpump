import { getDailySheets } from '@/app/actions';
import ReportView from '@/components/ReportView';

export default async function ReportPage() {
    const dailySheets = await getDailySheets();

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <ReportView dailySheets={dailySheets} />
        </main>
    );
}
