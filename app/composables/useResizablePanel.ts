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

  function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    dragging.value = true;
    const startX = e.clientX;
    const startWidth = width.value;

    function onMouseMove(e: MouseEvent) {
      const delta = startX - e.clientX;
      width.value = Math.min(max, Math.max(min, startWidth + delta));
    }

    function onMouseUp() {
      dragging.value = false;
      localStorage.setItem(storageKey, String(width.value));
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseDownLeft(e: MouseEvent) {
    e.preventDefault();
    dragging.value = true;
    const startX = e.clientX;
    const startWidth = width.value;

    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - startX;
      width.value = Math.min(max, Math.max(min, startWidth + delta));
    }

    function onMouseUp() {
      dragging.value = false;
      localStorage.setItem(storageKey, String(width.value));
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return { width, dragging, onMouseDown, onMouseDownLeft };
}
