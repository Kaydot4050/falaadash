import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function fulfillOrder() {
  await db.update(ordersTable).set({ status: 'fulfilled' }).where(eq(ordersTable.paystackReference, 'cfc9903a-98c0-4f38-b20f-122318f44b5c'));
  console.log("Order cfc9903a-98c0-4f38-b20f-122318f44b5c fulfilled successfully");
  process.exit(0);
}

fulfillOrder().catch(err => {
  console.error(err);
  process.exit(1);
});
