import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** OpenDOSM standard integer formatting with commas e.g. 2,082,000 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString("en-MY");
}

/** OpenDOSM standard ratio formatting (2 decimal places) e.g. 1.19 */
export function formatRatio(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0.00";
  return num.toFixed(2);
}

/** OpenDOSM standard percentage formatting (1 decimal place) e.g. 62.8% */
export function formatPct(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0.0%";
  return `${num.toFixed(1)}%`;
}
