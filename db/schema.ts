import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Daily Sheet metadata
export const dailySheets = sqliteTable('daily_sheets', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    salesPerson: text('sales_person'),
    pumpId: integer('pump_id').notNull().default(1),
    // Totals
    totalNozzleSales: real('total_nozzle_sales').notNull().default(0),
    totalCreditSales: real('total_credit_sales').notNull().default(0),
    totalOilLube: real('total_oil_lube').notNull().default(0),
    paytmAmount: real('paytm_amount').notNull().default(0),
    cardAmount: real('card_amount').notNull().default(0),
    fleatCardAmount: real('fleat_card_amount').notNull().default(0),
    creditAmount: real('credit_amount').notNull().default(0),
    nightCashAmount: real('night_cash_amount').notNull().default(0),
    totalToBank: real('total_to_bank').notNull().default(0),
    // Approval workflow
    isApproved: integer('is_approved', { mode: 'boolean' }).notNull().default(false),
    approvedBy: text('approved_by'),
    approvedAt: integer('approved_at', { mode: 'timestamp' }),
});


// Nozzle sales (existing table, keeping it)
export const sales = sqliteTable('sales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dailySheetId: integer('daily_sheet_id').references(() => dailySheets.id),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    salesPerson: text('sales_person'),
    nozzle: text('nozzle').notNull(), // A1, A2, B1, B2
    product: text('product').notNull(), // Petrol, Diesel
    openReading: real('open_reading').notNull(),
    closeReading: real('close_reading').notNull(),
    testing: real('testing').notNull().default(0),
    totalSale: real('total_sale').notNull(),
    rate: real('rate').notNull(),
    totalAmount: real('total_amount').notNull(),
});

// Credit sales
export const creditSales = sqliteTable('credit_sales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dailySheetId: integer('daily_sheet_id').references(() => dailySheets.id),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    customerName: text('customer_name').notNull(),
    amount: real('amount').notNull(),
    paymentMethod: text('payment_method').notNull(), // CARD, PAYTM, FLEAT CARD
});

// Oil & Lube sales
export const oilLubeSales = sqliteTable('oil_lube_sales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dailySheetId: integer('daily_sheet_id').references(() => dailySheets.id),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    productName: text('product_name').notNull(),
    quantity: real('quantity').notNull(),
    price: real('price').notNull(),
    total: real('total').notNull(),
});

// Users table for authentication
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    password: text('password').notNull(), // Hashed password
    role: text('role').notNull(), // 'admin', 'owner', 'manager'
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type DailySheet = typeof dailySheets.$inferSelect;
export type NewDailySheet = typeof dailySheets.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type CreditSale = typeof creditSales.$inferSelect;
export type NewCreditSale = typeof creditSales.$inferInsert;
export type OilLubeSale = typeof oilLubeSales.$inferSelect;
export type NewOilLubeSale = typeof oilLubeSales.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
