import { db, ordersTable } from "@workspace/db";
import { desc } from "drizzle-orm";

async function listOrders() {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
  console.log("Last 10 orders:", JSON.stringify(orders, null, 2));
  process.exit(0);
}

listOrders().catch(err => {
  console.error(err);
  process.exit(1);
});
