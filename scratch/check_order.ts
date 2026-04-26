import { db, ordersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

async function checkOrder() {
  const ref = "MN-IN804";
  const orders = await db.select().from(ordersTable)
    .where(or(
      eq(ordersTable.orderReference, ref),
      eq(ordersTable.paystackReference, ref)
    ));
    
  console.log("Current state:", JSON.stringify(orders, null, 2));
  process.exit(0);
}

checkOrder().catch(err => {
  console.error(err);
  process.exit(1);
});
