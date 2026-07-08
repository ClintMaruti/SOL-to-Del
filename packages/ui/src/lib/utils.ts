import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  const clsxResult = clsx(inputs);
  const result = twMerge(clsxResult);
  return result;
}
