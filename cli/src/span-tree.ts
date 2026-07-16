// Reuse the app's span-tree builder rather than copying it (single source of truth).
export { buildSpanTree } from '../../app/utils/span-tree';
export type { SpanTreeNode } from '../../app/utils/span-tree';
