export function useResizablePanel(storageKey: string, defaultWidth: number, options?: { min?: number; max?: number }) {
  const min = options?.min ?? 280;
  const max = options?.max ?? 800;

  const width = ref(defaultWidth);

  onMounted(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
        width.value = parsed;
      }
    }
  });

  const dragging = ref(false);

  function preventSelect(e: Event) {
    e.preventDefault();
  }

  function startDrag(e: MouseEvent, direction: 'left' | 'right') {
    e.preventDefault();
    dragging.value = true;
    const startX = e.clientX;
    const startWidth = width.value;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('selectstart', preventSelect);

    function onMouseMove(e: MouseEvent) {
      const delta = direction === 'right'
        ? startX - e.clientX
        : e.clientX - startX;
      width.value = Math.min(max, Math.max(min, startWidth + delta));
    }

    function onMouseUp() {
      dragging.value = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('selectstart', preventSelect);
      localStorage.setItem(storageKey, String(width.value));
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseDown(e: MouseEvent) {
    startDrag(e, 'right');
  }

  function onMouseDownLeft(e: MouseEvent) {
    startDrag(e, 'left');
  }

  return { width, dragging, onMouseDown, onMouseDownLeft };
}
