import { db, ordersTable } from '@workspace/db';
import { eq, and, lt } from 'drizzle-orm';

async function cleanup() {
  console.log("Cleaning up pending orders...");
  
  try {
    // 1. Delete the specific stuck order mentioned in logs
    const result1 = await db.delete(ordersTable)
      .where(eq(ordersTable.paystackReference, '0aa84013-27f4-484a-8d05-c3ee41824f9a'));
    
    console.log("Deleted specific pending order.");

    // 2. Also delete any other pending orders older than 30 minutes to be safe
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result2 = await db.delete(ordersTable)
      .where(and(
        eq(ordersTable.status, 'pending'),
        lt(ordersTable.createdAt, thirtyMinsAgo)
      ));
      
    console.log("Cleaned up old pending orders.");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
