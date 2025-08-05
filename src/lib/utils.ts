import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Colombian peso format with dots as thousand separators
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "$1.999.999,00"
 */
export function formatPrice(
  amount: number | string | undefined | null,
  decimals: number = 2
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "$0,00";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return "$0,00";
  }

  // Format the number with dots as thousand separators and comma as decimal separator
  const formatted = numAmount.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `$${formatted}`;
}

/**
 * Formats a number to Colombian peso format without decimals
 * @param amount - The amount to format
 * @returns Formatted string like "$1.999.999"
 */
export function formatPriceNoDecimals(
  amount: number | string | undefined | null
): string {
  return formatPrice(amount, 0);
}

export function formatPriceWithDollarSign(priceInCents: number): string {
  const pesos = priceInCents / 100;
  return `$${pesos.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: {
    name: string;
  };
  business?: Array<{
    id: string;
    name: string;
    branchLimit: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  branch?: {
    id: string;
    name: string;
    business: {
      id: string;
      name: string;
      branchLimit: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  userBranches?: Array<{
    branch: {
      id: string;
      name: string;
      business: {
        id: string;
        name: string;
        branchLimit: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    };
  }>;
}

export function extractBusinessAndBranchIds(user: User | null): {
  businessId: string;
  branchId: string;
} {
  let businessId = "";
  let branchId = "";

  if (!user) {
    return { businessId, branchId };
  }

  // Debug user structure
  console.log("🔍 [extractBusinessAndBranchIds] User structure:", {
    user: user,
    business: user?.business,
    branch: user?.branch,
    userBranches: user?.userBranches,
  });

  if (user.business && user.business.length > 0) {
    // Admin user - has direct business access
    businessId = user.business[0].id;
    branchId = user?.branch?.id || "";
    console.log(
      "🔍 [extractBusinessAndBranchIds] Admin user - Business ID:",
      businessId,
      "Branch ID:",
      branchId
    );
  } else if (user.branch?.business?.id) {
    // Cashier user - has branch with business
    businessId = user.branch.business.id;
    branchId = user.branch.id;
    console.log(
      "🔍 [extractBusinessAndBranchIds] Cashier user - Business ID:",
      businessId,
      "Branch ID:",
      branchId
    );
  } else if (user.userBranches && user.userBranches.length > 0) {
    // User with userBranches relationship
    businessId = user.userBranches[0].branch.business.id;
    branchId = user.userBranches[0].branch.id;
    console.log(
      "🔍 [extractBusinessAndBranchIds] User with userBranches - Business ID:",
      businessId,
      "Branch ID:",
      branchId
    );
  }

  console.log(
    "🔍 [extractBusinessAndBranchIds] Final Business ID:",
    businessId,
    "Branch ID:",
    branchId
  );
  return { businessId, branchId };
}
