// Color palette. Depth colors mirror the web waterfall (TraceWaterfall.vue).
import { TextAttributes } from '@opentui/core';

export const BOLD = TextAttributes.BOLD;

export const DEPTH_COLORS = [
  '#3b82f6', // blue   — root
  '#a855f7', // purple
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#6366f1', // indigo
];

export const ERROR_RED = '#ef4444';
export const OK_GREEN = '#22c55e';

// UI chrome (zinc scale, matching the web app)
export const UI = {
  bg: '#09090b', // zinc-950
  panel: '#18181b', // zinc-900
  border: '#27272a', // zinc-800
  borderActive: '#52525b', // zinc-600
  text: '#d4d4d8', // zinc-300
  textStrong: '#f4f4f5', // zinc-100
  dim: '#71717a', // zinc-500
  accent: '#3b82f6', // blue-500
};

const STATUS_ERROR = 2;

export function depthColor(depth: number, statusCode: number): string {
  if (statusCode === STATUS_ERROR) return ERROR_RED;
  return DEPTH_COLORS[depth % DEPTH_COLORS.length]!;
}
