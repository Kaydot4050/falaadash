import { db, ordersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

async function fixOrder() {
  const ref = "MN-IN8044CY";
  console.log(`Updating order ${ref} to fulfilled...`);
  
  const result = await db.update(ordersTable)
    .set({ status: "fulfilled", updatedAt: new Date() })
    .where(or(
      eq(ordersTable.orderReference, ref),
      eq(ordersTable.paystackReference, ref)
    ));
    
  console.log("Update complete.");
  process.exit(0);
}

fixOrder().catch(err => {
  console.error(err);
  process.exit(1);
});
