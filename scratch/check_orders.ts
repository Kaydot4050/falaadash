import { db, ordersTable } from "../lib/db/src/index";
import { count, sql, lt } from "drizzle-orm";

async function main() {
  const today = new Date("2026-04-23T00:00:00Z");
  
  const [oldOrders] = await db.select({ value: count() })
    .from(ordersTable)
    .where(lt(ordersTable.createdAt, today));

  console.log(`Orders before today: ${oldOrders.value}`);
}

main().catch(console.error);
