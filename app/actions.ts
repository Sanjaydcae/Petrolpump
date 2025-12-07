'use server';

import { db } from '@/db';
import { sales, creditSales, oilLubeSales, dailySheets, users, tankReadings } from '@/db/schema';
import { desc, eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hashPassword, verifyPassword, type AuthUser } from '@/lib/auth';

export async function getDailySheetByDate(dateStr: string, pumpId: number = 1) {
    try {
        // Find sheet by date (ignoring time)
        // SQLite stores dates as timestamps (ms). We need to match the day.
        // Since we save as new Date(dateStr), it usually sets time to 00:00:00 UTC or Local depending on input.
        // Best approach: Store date as string YYYY-MM-DD in DB or query by range.
        // For now, let's assume the input dateStr is YYYY-MM-DD and we query for that exact timestamp if we saved it normalized.
        // Or better: Fetch all and filter in JS (inefficient but safe for small app) or use SQL between.

        // Let's try to match the exact Date object created from the string
        const targetDate = new Date(dateStr);

        // Since we might have time issues, let's search by range for that day
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        const [sheet] = await db.select().from(dailySheets)
            .where(and(
                gte(dailySheets.date, startOfDay),
                lte(dailySheets.date, endOfDay),
                eq(dailySheets.pumpId, pumpId)
            ));

        if (!sheet) return null;

        return await getDailySheetDetails(sheet.id);
    } catch (error) {
        console.error('Error fetching daily sheet by date:', error);
        return null;
    }
}

export async function saveDailySheet(data: any) {
    try {
        const date = new Date(data.date);
        const pumpId = data.pumpId || 1;

        // Check if sheet exists for this date
        const existing = await getDailySheetByDate(data.date, pumpId);
        let dailySheetId;

        if (existing) {
            // UPDATE existing sheet
            dailySheetId = existing.id;

            await db.update(dailySheets).set({
                salesPerson: data.salesPerson || null,
                totalNozzleSales: data.totals.totalNozzleSales,
                totalCreditSales: data.totals.totalCreditSales,
                totalOilLube: data.totals.totalOilLube,
                paytmAmount: data.paymentMethods.paytm,
                cardAmount: data.paymentMethods.card,
                fleatCardAmount: data.paymentMethods.fleatCard,
                creditAmount: data.paymentMethods.credit,
                nightCashAmount: data.paymentMethods.nightCash,
                totalToBank: data.totals.totalToBank,
            }).where(eq(dailySheets.id, dailySheetId));

            // Delete old nozzle sales only (credit/oil handled separately to prevent data loss)
            await db.delete(sales).where(eq(sales.dailySheetId, dailySheetId));

        } else {
            // INSERT new sheet
            const [dailySheet] = await db.insert(dailySheets).values({
                date: date,
                pumpId: pumpId,
                salesPerson: data.salesPerson || null,
                totalNozzleSales: data.totals.totalNozzleSales,
                totalCreditSales: data.totals.totalCreditSales,
                totalOilLube: data.totals.totalOilLube,
                paytmAmount: data.paymentMethods.paytm,
                cardAmount: data.paymentMethods.card,
                fleatCardAmount: data.paymentMethods.fleatCard,
                creditAmount: data.paymentMethods.credit,
                nightCashAmount: data.paymentMethods.nightCash,
                totalToBank: data.totals.totalToBank,
            }).returning();
            dailySheetId = dailySheet.id;
        }

        // Insert nozzle sales
        if (data.nozzles.length > 0) {
            await db.insert(sales).values(
                data.nozzles.map((n: any) => ({
                    dailySheetId,
                    date: date,
                    salesPerson: data.salesPerson,
                    nozzle: n.nozzle,
                    product: n.product,
                    openReading: n.openReading,
                    closeReading: n.closeReading,
                    testing: parseFloat(n.testing) || 0,
                    totalSale: n.totalSale,
                    rate: n.product === 'Petrol' ? data.petrolRate : data.dieselRate,
                    totalAmount: n.totalAmount,
                }))
            );
        }

        // Insert credit sales (only valid entries with customer names)
        const validCreditSales = data.creditSales.filter((c: any) => c.name && c.name.trim() !== '' && parseFloat(c.amount) > 0);
        // Only delete old credit records if we have new ones to insert
        if (validCreditSales.length > 0) {
            await db.delete(creditSales).where(eq(creditSales.dailySheetId, dailySheetId));
            await db.insert(creditSales).values(
                validCreditSales.map((c: any) => ({
                    dailySheetId,
                    date: date,
                    customerName: c.name.trim(),
                    amount: parseFloat(c.amount),
                    paymentMethod: c.paymentMethod || 'CREDIT',
                }))
            );
        }

        // Insert oil & lube sales (only entries with quantity > 0)
        const validOilLubeSales = data.oilLubeSales.filter((o: any) => parseFloat(o.quantity) > 0);
        // Only delete old oil/lube records if we have new ones to insert
        if (validOilLubeSales.length > 0) {
            await db.delete(oilLubeSales).where(eq(oilLubeSales.dailySheetId, dailySheetId));
            await db.insert(oilLubeSales).values(
                validOilLubeSales.map((o: any) => ({
                    dailySheetId,
                    date: date,
                    productName: `${o.name} ${o.size || ''}`.trim(),
                    quantity: parseFloat(o.quantity),
                    price: o.price || 0,
                    total: o.total || 0,
                }))
            );
        }

        revalidatePath('/');
        revalidatePath('/report');
        return { success: true, message: existing ? 'Daily sheet updated!' : 'Daily sheet saved!' };
    } catch (error) {
        console.error('Error saving daily sheet:', error);
        return { error: 'Failed to save daily sheet' };
    }
}

export async function getDailySheets() {
    try {
        const sheets = await db.select().from(dailySheets).orderBy(desc(dailySheets.date)).limit(30);
        return sheets;
    } catch (error) {
        console.error('Error fetching daily sheets:', error);
        return [];
    }
}

// Get monthly petrol and diesel sales summary (in liters)
export async function getMonthlySalesSummary(month: number, year: number) {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const allSales = await db.select().from(sales)
            .where(and(
                gte(sales.date, startDate),
                lte(sales.date, endDate)
            ));

        let petrolLiters = 0;
        let dieselLiters = 0;

        allSales.forEach((sale: any) => {
            if (sale.product === 'Petrol') {
                petrolLiters += sale.totalSale || 0;
            } else if (sale.product === 'Diesel') {
                dieselLiters += sale.totalSale || 0;
            }
        });

        return { petrolLiters, dieselLiters };
    } catch (error) {
        console.error('Error fetching monthly sales summary:', error);
        return { petrolLiters: 0, dieselLiters: 0 };
    }
}



// Approve a daily sheet (owner/admin only)
export async function approveDailySheet(dailySheetId: number, approvedByUsername: string): Promise<{ success: boolean; error?: string }> {
    try {
        const [sheet] = await db.select().from(dailySheets).where(eq(dailySheets.id, dailySheetId)).limit(1);

        if (!sheet) {
            return { success: false, error: 'Daily sheet not found' };
        }

        if (sheet.isApproved) {
            return { success: false, error: 'Daily sheet is already approved' };
        }

        await db.update(dailySheets).set({
            isApproved: true,
            approvedBy: approvedByUsername,
            approvedAt: new Date(),
        }).where(eq(dailySheets.id, dailySheetId));

        revalidatePath('/report');
        return { success: true };
    } catch (error) {
        console.error('Error approving daily sheet:', error);
        return { success: false, error: 'Failed to approve daily sheet' };
    }
}


export async function getSales() {
    try {
        const result = await db.select().from(sales).orderBy(desc(sales.date)).limit(100);
        return result;
    } catch (error) {
        console.error('Error fetching sales:', error);
        return [];
    }
}

export async function getDailySheetDetails(dailySheetId: number) {
    try {
        const [sheet] = await db.select().from(dailySheets).where(eq(dailySheets.id, dailySheetId));
        if (!sheet) return null;

        const nozzleSales = await db.select().from(sales).where(eq(sales.dailySheetId, dailySheetId));
        const credits = await db.select().from(creditSales).where(eq(creditSales.dailySheetId, dailySheetId));
        const oilLube = await db.select().from(oilLubeSales).where(eq(oilLubeSales.dailySheetId, dailySheetId));

        return {
            ...sheet,
            nozzleSales,
            creditSales: credits,
            oilLubeSales: oilLube,
        };
    } catch (error) {
        console.error('Error fetching daily sheet details:', error);
        return null;
    }
}

export async function getMonthlyReportData(month: number, year: number) {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // 1. Get all daily sheets for the month to sum up totals
        const sheets = await db.select().from(dailySheets)
            .where(and(
                gte(dailySheets.date, startDate),
                lte(dailySheets.date, endDate)
            ));

        // 2. Aggregate Oil & Lube Sales
        const oilLube = await db.select().from(oilLubeSales)
            .where(and(
                gte(oilLubeSales.date, startDate),
                lte(oilLubeSales.date, endDate)
            ));

        const oilLubeSummary: Record<string, { quantity: number, total: number, price: number }> = {};
        oilLube.forEach(item => {
            if (!oilLubeSummary[item.productName]) {
                oilLubeSummary[item.productName] = { quantity: 0, total: 0, price: item.price };
            }
            oilLubeSummary[item.productName].quantity += item.quantity;
            oilLubeSummary[item.productName].total += item.total;
        });

        // 3. Aggregate Credit Sales
        const credits = await db.select().from(creditSales)
            .where(and(
                gte(creditSales.date, startDate),
                lte(creditSales.date, endDate)
            ));

        const creditSummary: Record<string, number> = {};
        credits.forEach(item => {
            if (!creditSummary[item.customerName]) {
                creditSummary[item.customerName] = 0;
            }
            creditSummary[item.customerName] += item.amount;
        });

        // 4. Calculate Totals
        const totalPetrol = sheets.reduce((sum, s) => sum + (s.totalNozzleSales || 0), 0); // Note: This is total pump sale, not just petrol. 
        // To get exact Petrol vs Diesel, we need to query sales table.

        const allSales = await db.select().from(sales)
            .where(and(
                gte(sales.date, startDate),
                lte(sales.date, endDate)
            ));

        const petrolSales = allSales.filter(s => s.product === 'Petrol').reduce((sum, s) => sum + s.totalAmount, 0);
        const dieselSales = allSales.filter(s => s.product === 'Diesel').reduce((sum, s) => sum + s.totalAmount, 0);
        const totalOilLube = sheets.reduce((sum, s) => sum + (s.totalOilLube || 0), 0);

        return {
            oilLube: Object.entries(oilLubeSummary).map(([name, data]) => ({ name, ...data })),
            credits: Object.entries(creditSummary).map(([name, amount]) => ({ name, amount })),
            totals: {
                petrol: petrolSales,
                diesel: dieselSales,
                oilLube: totalOilLube,
                grandTotal: petrolSales + dieselSales + totalOilLube
            }
        };

    } catch (error) {
        return null;
    }
}

export async function resetDatabase() {
    try {
        // Delete all data in reverse order of dependencies
        await db.delete(sales);
        await db.delete(creditSales);
        await db.delete(oilLubeSales);
        await db.delete(dailySheets);

        revalidatePath('/');
        revalidatePath('/report');
        revalidatePath('/sale');

        return { success: true, message: 'Database reset successfully' };
    } catch (error) {
        console.error('Error resetting database:', error);
        return { error: 'Failed to reset database' };
    }
}

// ===== AUTHENTICATION ACTIONS =====

// Seed admin user if doesn't exist
export async function seedAdminUser() {
    try {
        // Import and run migrations to ensure tables exist
        const { runMigrations } = await import('@/db');
        await runMigrations();

        const existingAdmin = await db.select().from(users).where(eq(users.username, 'sanjay')).limit(1);

        if (existingAdmin.length === 0) {
            await db.insert(users).values({
                username: 'sanjay',
                password: hashPassword('Hello@123!'),
                role: 'admin',
                createdAt: new Date(),
            });
            console.log('Admin user seeded successfully');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
}


// Login action
export async function login(username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
        await seedAdminUser();
        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (!user) {
            return { success: false, error: 'Invalid username or password' };
        }

        if (!verifyPassword(password, user.password)) {
            return { success: false, error: 'Invalid username or password' };
        }

        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role as 'admin' | 'owner' | 'manager',
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
}

// Get all users (admin only)
export async function getUsers() {
    try {
        const allUsers = await db.select({
            id: users.id,
            username: users.username,
            role: users.role,
            createdAt: users.createdAt,
        }).from(users).orderBy(desc(users.createdAt));

        return allUsers;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Create user (admin only)
export async function createUser(username: string, password: string, role: 'owner' | 'manager'): Promise<{ success: boolean; error?: string }> {
    try {
        const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (existing.length > 0) {
            return { success: false, error: 'Username already exists' };
        }

        await db.insert(users).values({
            username,
            password: hashPassword(password),
            role,
            createdAt: new Date(),
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Failed to create user' };
    }
}

// Delete user (admin only)
export async function deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('[DELETE USER] Starting deletion for userId:', userId);

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        console.log('[DELETE USER] Found user:', user);

        if (user && user.role === 'admin') {
            console.log('[DELETE USER] Cannot delete admin user');
            return { success: false, error: 'Cannot delete admin user' };
        }

        console.log('[DELETE USER] Attempting to delete user from database');
        const result = await db.delete(users).where(eq(users.id, userId));
        console.log('[DELETE USER] Delete result:', result);

        console.log('[DELETE USER] Revalidating path /settings');
        revalidatePath('/settings');

        console.log('[DELETE USER] Deletion successful');
        return { success: true };
    } catch (error) {
        console.error('[DELETE USER] Error deleting user:', error);
        return { success: false, error: 'Failed to delete user' };
    }
}

// ===== TANK READING ACTIONS =====

import { TANK_CAPACITIES } from '@/lib/constants';

// Save tank DIP reading
export async function saveTankReading(data: { date: string; tank: 'Petrol' | 'Diesel'; dipReading: number; liters: number; recordedBy?: string }) {
    try {
        const { runMigrations } = await import('@/db');
        await runMigrations();

        await db.insert(tankReadings).values({
            date: new Date(data.date),
            tank: data.tank,
            dipReading: data.dipReading,
            liters: data.liters,
            recordedBy: data.recordedBy || null,
            createdAt: new Date(),
        });

        revalidatePath('/');
        revalidatePath('/tank');
        return { success: true, message: `${data.tank} tank reading saved!` };
    } catch (error) {
        console.error('Error saving tank reading:', error);
        return { success: false, error: 'Failed to save tank reading' };
    }
}

// Get latest reading for each tank
export async function getLatestTankReadings() {
    try {
        const { runMigrations } = await import('@/db');
        await runMigrations();

        // Get latest Petrol reading
        const [petrolReading] = await db.select()
            .from(tankReadings)
            .where(eq(tankReadings.tank, 'Petrol'))
            .orderBy(desc(tankReadings.date))
            .limit(1);

        // Get latest Diesel reading
        const [dieselReading] = await db.select()
            .from(tankReadings)
            .where(eq(tankReadings.tank, 'Diesel'))
            .orderBy(desc(tankReadings.date))
            .limit(1);

        return {
            petrol: petrolReading ? {
                dipReading: petrolReading.dipReading,
                level: petrolReading.liters || petrolReading.dipReading, // Use liters, fallback to dipReading
                capacity: TANK_CAPACITIES.Petrol,
                percentage: Math.round(((petrolReading.liters || petrolReading.dipReading) / TANK_CAPACITIES.Petrol) * 100),
                date: petrolReading.date,
                recordedBy: petrolReading.recordedBy,
            } : null,
            diesel: dieselReading ? {
                dipReading: dieselReading.dipReading,
                level: dieselReading.liters || dieselReading.dipReading, // Use liters, fallback to dipReading
                capacity: TANK_CAPACITIES.Diesel,
                percentage: Math.round(((dieselReading.liters || dieselReading.dipReading) / TANK_CAPACITIES.Diesel) * 100),
                date: dieselReading.date,
                recordedBy: dieselReading.recordedBy,
            } : null,
        };
    } catch (error) {
        console.error('Error fetching tank readings:', error);
        return { petrol: null, diesel: null };
    }
}

// Get tank reading history
export async function getTankHistory(limit = 20) {
    try {
        const { runMigrations } = await import('@/db');
        await runMigrations();

        const readings = await db.select()
            .from(tankReadings)
            .orderBy(desc(tankReadings.date))
            .limit(limit);

        return readings;
    } catch (error) {
        console.error('Error fetching tank history:', error);
        return [];
    }
}

// Update tank reading
export async function updateTankReading(id: number, data: { dipReading: number; liters: number }) {
    try {
        await db.update(tankReadings)
            .set({
                dipReading: data.dipReading,
                liters: data.liters,
            })
            .where(eq(tankReadings.id, id));

        revalidatePath('/');
        revalidatePath('/tank');
        return { success: true };
    } catch (error) {
        console.error('Error updating tank reading:', error);
        return { success: false, error: 'Failed to update' };
    }
}

// Delete tank reading
export async function deleteTankReading(id: number) {
    try {
        await db.delete(tankReadings).where(eq(tankReadings.id, id));

        revalidatePath('/');
        revalidatePath('/tank');
        return { success: true };
    } catch (error) {
        console.error('Error deleting tank reading:', error);
        return { success: false, error: 'Failed to delete' };
    }
}
