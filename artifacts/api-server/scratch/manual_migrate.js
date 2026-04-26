import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://neondb_owner:npg_zPdLkof4hb1G@ep-misty-fog-amez4iza-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log("Checking columns in 'orders' table...");
    
    // Add columns to orders table
    await client.query(`
      ALTER TABLE "orders" 
      ADD COLUMN IF NOT EXISTS "audit_logs" jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS "retry_count" integer DEFAULT 0 NOT NULL;
    `);
    console.log("Updated 'orders' table columns.");

    // Create order_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "order_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "event_type" text NOT NULL,
        "event_data" jsonb DEFAULT '{}'::jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Created 'order_events' table.");

    console.log("Schema update successful!");
  } catch (err) {
    console.error("Schema update failed:", err);
  } finally {
    await client.end();
  }
}

run();
