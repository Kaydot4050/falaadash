
import { db, ordersTable } from "../lib/db/src";
import { eq } from "drizzle-orm";

async function mockNames() {
  console.log("Mocking customer names...");
  
  const orders = await db.select().from(ordersTable);
  
  const names = ["Charles", "Chisella", "Tequila", "Blessing", "Emmanuel", "Prince", "Abena", "Kofi", "Ama", "Nana"];
  
  for (let i = 0; i < orders.length; i++) {
    const name = names[i % names.length];
    await db.update(ordersTable)
      .set({ customerName: name })
      .where(eq(ordersTable.id, orders[i].id));
    console.log(`Updated ${orders[i].phoneNumber} to ${name}`);
  }
}

mockNames().catch(console.error);
