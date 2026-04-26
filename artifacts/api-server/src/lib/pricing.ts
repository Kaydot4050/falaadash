import { logger } from "./logger";

export interface DataPackage {
  capacity: string;
  mb: string;
  price: string;
  oldPrice?: string;
  network: string;
  inStock: boolean;
  isHidden?: boolean;
}

/**
 * Falaa Deals Custom Price Mapping (GHS)
 * Keys are formatted as "{network}_{capacity}GB" or "{network}_{capacity}MB"
 */
const PRICE_MAP: Record<string, string> = {
  // MTN (YELLO)
  "YELLO_1GB": "4.99",
  "YELLO_2GB": "9.49",
  "YELLO_3GB": "13.50",
  "YELLO_4GB": "18.50",
  "YELLO_5GB": "23.50",
  "YELLO_6GB": "26.99",
  "YELLO_8GB": "36.70",
  "YELLO_10GB": "43.70",
  "YELLO_15GB": "67.00",
  "YELLO_20GB": "84.00",
  "YELLO_25GB": "105.00",
  "YELLO_30GB": "130.00",
  "YELLO_40GB": "170.00",
  "YELLO_50GB": "210.00",
};

/**
 * Historical prices for strike-through UI
 */
const OLD_PRICE_MAP: Record<string, string> = {
  "YELLO_1GB": "5.00",
  "YELLO_2GB": "9.80",
  "YELLO_3GB": "14.00",
  "YELLO_4GB": "19.50",
  "YELLO_5GB": "24.00",
  "YELLO_6GB": "28.00",
  "YELLO_8GB": "37.50",
  "YELLO_10GB": "45.00",
  "YELLO_20GB": "85.00",

  // AirtelTigo (AT_PREMIUM)
  "AT_PREMIUM_1GB": "5.00",
  "AT_PREMIUM_2GB": "9.50",
  "AT_PREMIUM_3GB": "14.50",
  "AT_PREMIUM_4GB": "18.50",
  "AT_PREMIUM_5GB": "23.00",
  "AT_PREMIUM_6GB": "27.50",
  "AT_PREMIUM_8GB": "35.50",
  "AT_PREMIUM_10GB": "43.50",
  "AT_PREMIUM_12GB": "50.00",
  "AT_PREMIUM_15GB": "62.50",
  "AT_PREMIUM_25GB": "99.00",
  "AT_PREMIUM_30GB": "120.00",
  "AT_PREMIUM_40GB": "159.00",
  "AT_PREMIUM_50GB": "200.00",

  // Telecel
  "TELECEL_10GB": "43.50",
  "TELECEL_15GB": "64.00",
  "TELECEL_20GB": "84.00",
  "TELECEL_25GB": "98.00",
  "TELECEL_30GB": "122.00",
  "TELECEL_45GB": "155.00",
  "TELECEL_2GB": "9.49", // Added missing
  "TELECEL_1GB": "4.99", // Added missing
};

export function applyCustomPricing(packages: DataPackage[]): DataPackage[] {
  return packages.map((pkg) => {
    // Standard format: Network_CapacityGB (e.g. YELLO_1GB)
    const key = `${pkg.network}_${pkg.capacity}GB`;
    const customPrice = PRICE_MAP[key];

    if (customPrice) {
      return {
        ...pkg,
        price: customPrice,
        oldPrice: OLD_PRICE_MAP[key]
      };
    }

    // If no custom price found, we can optionally apply a default markup or keep original
    // For now, keeping original but logging a warning if it's a known network
    if (["YELLO", "AT_PREMIUM", "TELECEL"].includes(pkg.network)) {
       logger.debug(`No custom price for ${key}, using original: ${pkg.price}`);
    }

    return pkg;
  });
}
