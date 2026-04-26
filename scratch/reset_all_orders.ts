import { db, ordersTable } from "../lib/db/src/index";

async function main() {
  const result = await db.delete(ordersTable);
  console.log(`Successfully deleted all orders. Revenue and profit reset to zero.`);
}

main().catch(console.error);
