// Reuse the app's span-tree builder rather than copying it (single source of truth).
export { buildSpanTree } from '../../shared/parsers/span-tree';
export type { SpanTreeNode } from '../../shared/parsers/span-tree';
