import type { Trace, Span } from '../../shared/parsers/types';
import type { SpanTreeNode } from '~/utils/span-tree';
import { buildSpanTree } from '~/utils/span-tree';
import { alignByLCS } from '~/utils/lcs';
import { getTraceWithSpans } from '~/database/operations';

export interface AttributeDiff {
  key: string;
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  valueA?: any;
  valueB?: any;
}

export interface SpanDiff {
  durationDelta: number;
  durationPercent: number;
  statusChanged: boolean;
  attributeDiffs: AttributeDiff[];
  eventCountDelta: number;
}

export interface AlignedRow {
  type: 'matched' | 'added' | 'removed';
  spanA: SpanTreeNode | null;
  spanB: SpanTreeNode | null;
  diff?: SpanDiff;
}

export interface DiffSummary {
  matched: number;
  added: number;
  removed: number;
  faster: number;
  slower: number;
  statusChanges: number;
}

function diffAttributes(
  attrsA: Record<string, any>,
  attrsB: Record<string, any>,
): AttributeDiff[] {
  const allKeys = new Set([...Object.keys(attrsA), ...Object.keys(attrsB)]);
  const diffs: AttributeDiff[] = [];

  for (const key of allKeys) {
    const inA = key in attrsA;
    const inB = key in attrsB;

    if (inA && !inB) {
      diffs.push({ key, type: 'removed', valueA: attrsA[key] });
    } else if (!inA && inB) {
      diffs.push({ key, type: 'added', valueB: attrsB[key] });
    } else if (JSON.stringify(attrsA[key]) !== JSON.stringify(attrsB[key])) {
      diffs.push({
        key,
        type: 'changed',
        valueA: attrsA[key],
        valueB: attrsB[key],
      });
    } else {
      diffs.push({
        key,
        type: 'unchanged',
        valueA: attrsA[key],
        valueB: attrsB[key],
      });
    }
  }

  // Sort: changed/added/removed first, then unchanged
  const order = { changed: 0, added: 1, removed: 2, unchanged: 3 };
  diffs.sort((a, b) => order[a.type] - order[b.type]);

  return diffs;
}

function diffSpans(nodeA: SpanTreeNode, nodeB: SpanTreeNode): SpanDiff {
  const durationDelta = nodeB.span.duration - nodeA.span.duration;
  const durationPercent =
    nodeA.span.duration > 0
      ? (durationDelta / nodeA.span.duration) * 100
      : durationDelta > 0
        ? 100
        : 0;

  return {
    durationDelta,
    durationPercent,
    statusChanged: nodeA.span.status_code !== nodeB.span.status_code,
    attributeDiffs: diffAttributes(
      nodeA.span.attributes,
      nodeB.span.attributes,
    ),
    eventCountDelta: nodeB.span.events.length - nodeA.span.events.length,
  };
}

export function useTraceComparison(
  traceIdA: MaybeRefOrGetter<string>,
  traceIdB: MaybeRefOrGetter<string>,
) {
  const traceA = ref<Trace | null>(null);
  const traceB = ref<Trace | null>(null);
  const spansA = ref<Span[]>([]);
  const spansB = ref<Span[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const selectedRow = ref<AlignedRow | null>(null);

  const treeA = computed(() =>
    traceA.value ? buildSpanTree(spansA.value, traceA.value) : [],
  );
  const treeB = computed(() =>
    traceB.value ? buildSpanTree(spansB.value, traceB.value) : [],
  );

  const alignedRows = computed<AlignedRow[]>(() => {
    if (!treeA.value.length && !treeB.value.length) return [];

    const aligned = alignByLCS(treeA.value, treeB.value, (n) => n.matchKey);

    return aligned.map(({ a, b }) => {
      if (a && b) {
        return { type: 'matched', spanA: a, spanB: b, diff: diffSpans(a, b) };
      } else if (b) {
        return { type: 'added', spanA: null, spanB: b };
      } else {
        return { type: 'removed', spanA: a, spanB: null };
      }
    });
  });

  const diffSummary = computed<DiffSummary>(() => {
    const summary: DiffSummary = {
      matched: 0,
      added: 0,
      removed: 0,
      faster: 0,
      slower: 0,
      statusChanges: 0,
    };

    for (const row of alignedRows.value) {
      if (row.type === 'matched') {
        summary.matched++;
        if (row.diff) {
          if (row.diff.durationDelta < 0) summary.faster++;
          if (row.diff.durationDelta > 0) summary.slower++;
          if (row.diff.statusChanged) summary.statusChanges++;
        }
      } else if (row.type === 'added') {
        summary.added++;
      } else {
        summary.removed++;
      }
    }

    return summary;
  });

  const fetchBoth = async () => {
    const idA = toValue(traceIdA);
    const idB = toValue(traceIdB);

    if (!idA || !idB) return;

    loading.value = true;
    error.value = null;
    selectedRow.value = null;

    try {
      const [dataA, dataB] = await Promise.all([
        getTraceWithSpans(idA),
        getTraceWithSpans(idB),
      ]);

      traceA.value = dataA.trace ?? null;
      traceB.value = dataB.trace ?? null;
      spansA.value = dataA.spans;
      spansB.value = dataB.spans;
    } catch (err) {
      console.error('Error fetching traces for comparison:', err);
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => [toValue(traceIdA), toValue(traceIdB)],
    fetchBoth,
    { immediate: true },
  );

  return {
    traceA,
    traceB,
    spansA,
    spansB,
    alignedRows,
    selectedRow,
    diffSummary,
    loading,
    error,
  };
}
