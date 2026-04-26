import { db, ordersTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";

async function checkToday() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const orders = await db.select().from(ordersTable).where(and(eq(ordersTable.status, 'fulfilled'), gte(ordersTable.createdAt, today)));
  console.log("Today's fulfilled orders:", JSON.stringify(orders, null, 2));
  process.exit(0);
}

checkToday().catch(err => {
  console.error(err);
  process.exit(1);
});
