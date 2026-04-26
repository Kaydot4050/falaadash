import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: "postgresql://neondb_owner:npg_zPdLkof4hb1G@ep-misty-fog-amez4iza-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 
});

async function run() {
  try {
    console.log("Creating package_overrides table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "package_overrides" (
        "id" text PRIMARY KEY,
        "network" text NOT NULL,
        "capacity" text NOT NULL,
        "custom_price" numeric,
        "custom_old_price" numeric,
        "in_stock" boolean NOT NULL DEFAULT true,
        "is_hidden" boolean NOT NULL DEFAULT false,
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

run();
