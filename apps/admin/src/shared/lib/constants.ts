/**
 * Responsive breakpoint constants
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
