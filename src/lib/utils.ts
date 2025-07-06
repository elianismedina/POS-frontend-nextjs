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
