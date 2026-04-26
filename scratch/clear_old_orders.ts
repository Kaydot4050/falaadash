import { db, ordersTable } from "../lib/db/src/index";
import { lt } from "drizzle-orm";

async function main() {
  const today = new Date("2026-04-23T00:00:00Z");
  
  const result = await db.delete(ordersTable)
    .where(lt(ordersTable.createdAt, today));

  console.log(`Successfully deleted orders created before today.`);
}

main().catch(console.error);
