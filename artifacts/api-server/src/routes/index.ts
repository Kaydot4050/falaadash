import { Router, type IRouter } from "express";
import healthRouter from "./health";
import packagesRouter from "./packages";
import purchaseRouter from "./purchase";
import bulkPurchaseRouter from "./bulk-purchase";
import ordersRouter from "./orders";
import purchaseHistoryRouter from "./purchase-history";
import deliveryRouter from "./delivery";
import accountRouter from "./account";
import referralRouter from "./referral";
import statsRouter from "./stats";
import withdrawalsRouter from "./withdrawals";
import paystackRouter from "./paystack";
import datamartWebhookRouter from "./datamart-webhook";
import adminPackagesRouter from "./admin-packages";
import adminCustomersRouter from "./admin-customers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(packagesRouter);
router.use(adminPackagesRouter);
router.use(adminCustomersRouter);
router.use(purchaseRouter);
router.use(bulkPurchaseRouter);
router.use(ordersRouter);
router.use(purchaseHistoryRouter);
router.use(deliveryRouter);
router.use(accountRouter);
router.use(referralRouter);
router.use(statsRouter);
router.use(withdrawalsRouter);
router.use(paystackRouter);
router.use(datamartWebhookRouter);

export default router;
