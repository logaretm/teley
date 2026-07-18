import { useEffect } from 'react';
import type { RefObject } from 'react';
import { LayoutEvents, type ScrollBoxRenderable } from '@opentui/core';

// The scrollbox is rendered with its scrollbar hidden and in manual mode (see
// scrollbarOptions in the detail panels), so it never auto-shows during layout.
// This hook owns revealing it: it measures the renderable (content height vs
// viewport height) and drives both the scrollbar and the caller's hint from that.
// We re-measure on layout changes; no polling, no delay.
export function useScrollOverflow(
  scrollRef: RefObject<ScrollBoxRenderable | null>,
  onScrollable: (scrollable: boolean) => void,
) {
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;

    const measure = () => {
      const viewport = box.viewport.height;
      if (viewport <= 0) return; // not laid out yet
      const scrollable = box.scrollHeight > viewport;
      box.verticalScrollBar.visible = scrollable;
      onScrollable(scrollable);
    };
    measure();
    box.on(LayoutEvents.LAYOUT_CHANGED, measure);

    return () => {
      box.off(LayoutEvents.LAYOUT_CHANGED, measure);
      onScrollable(false); // panel unmounting; clear the hint
    };
  }, [scrollRef, onScrollable]);
}
