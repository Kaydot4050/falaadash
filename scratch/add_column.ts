
import { db } from "../lib/db/src";
import { sql } from "drizzle-orm";

async function addColumn() {
  console.log("Adding customer_name column...");
  try {
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;`);
    console.log("Column added successfully!");
  } catch (err) {
    console.error("Failed to add column:", err);
  }
}

addColumn().catch(console.error);
