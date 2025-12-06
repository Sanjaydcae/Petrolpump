/** @type {import('drizzle-kit').Config} */
module.exports = {
    schema: './db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'sqlite.db',
    },
};
