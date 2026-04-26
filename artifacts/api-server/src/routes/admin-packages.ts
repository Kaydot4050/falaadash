import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { packageOverridesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET all overrides
router.get("/admin/packages/overrides", async (req, res) => {
  try {
    const overrides = await db.select().from(packageOverridesTable);
    res.json({ status: "success", data: overrides });
  } catch (error) {
    logger.error({ error }, "Failed to fetch overrides:");
    res.status(500).json({ status: "error", message: "Failed to fetch overrides" });
  }
});

// POST update an override
router.post("/admin/packages/overrides", async (req, res): Promise<void> => {
  try {
    logger.info({ body: req.body }, "Incoming Override Request");
    const { id, network, capacity, customPrice, customOldPrice, showOldPrice, inStock, isHidden } = req.body;

    if (!id) {
      logger.error("Missing ID in override request");
      res.status(400).json({ status: "error", message: "Missing required ID" });
      return;
    }

    logger.info({ id, network, capacity, customPrice, showOldPrice, inStock }, "Attempting DB Upsert");

    // Upsert the override
    await db.insert(packageOverridesTable)
      .values({
        id,
        network,
        capacity: capacity?.toString(),
        customPrice: customPrice?.toString(),
        customOldPrice: customOldPrice?.toString(),
        showOldPrice: showOldPrice ?? true,
        inStock: inStock ?? true,
        isHidden: isHidden ?? false,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [packageOverridesTable.id],
        set: {
          network: network,
          capacity: capacity?.toString(),
          customPrice: customPrice?.toString(),
          customOldPrice: customOldPrice?.toString(),
          showOldPrice: showOldPrice ?? true,
          inStock: inStock ?? true,
          isHidden: isHidden ?? false,
          updatedAt: new Date()
        }
      });

    logger.info({ id }, "DB Upsert Successful");
    res.json({ status: "success", message: "Package updated successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to update override:");
    res.status(500).json({ status: "error", message: "Failed to update package override" });
  }
});

export default router;
