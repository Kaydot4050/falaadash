import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function findOrder() {
  const order = await db.select().from(ordersTable).where(eq(ordersTable.paystackReference, 'cfc9903a-98c0-4f38-b20f-122318f44b5c'));
  console.log("Order details:", JSON.stringify(order, null, 2));
  process.exit(0);
}

findOrder().catch(err => {
  console.error(err);
  process.exit(1);
});
