import { getServiceNames, onServiceNamesChange } from './useDataSync';

const selectedServices = ref<Set<string>>(new Set());
const traceServices = ref<string[]>([]);
const logServices = ref<string[]>([]);

let initialized = false;

const metricServices = ref<string[]>([]);

function sync() {
  const traces = Array.from(getServiceNames('traces')).sort();
  const logs = Array.from(getServiceNames('logs')).sort();
  const metrics = Array.from(getServiceNames('metrics')).sort();
  const prevAll = new Set([...traceServices.value, ...logServices.value, ...metricServices.value]);

  traceServices.value = traces;
  logServices.value = logs;
  metricServices.value = metrics;

  // Auto-select newly discovered services
  const allNow = new Set([...traces, ...logs, ...metrics]);
  for (const name of allNow) {
    if (!prevAll.has(name)) {
      selectedServices.value.add(name);
    }
  }
}

export function useServiceFilter() {
  if (!initialized) {
    initialized = true;
    sync();
    onServiceNamesChange(sync);
  }

  const route = useRoute();

  const availableServices = computed(() => {
    if (route.path === '/logs') return logServices.value;
    if (route.path === '/metrics') return metricServices.value;
    return traceServices.value;
  });

  const hasMultipleServices = computed(() => availableServices.value.length >= 2);

  function toggleService(name: string) {
    const next = new Set(selectedServices.value);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    selectedServices.value = next;
  }

  function selectAll() {
    selectedServices.value = new Set([
      ...selectedServices.value,
      ...availableServices.value,
    ]);
  }

  function deselectAll() {
    const next = new Set(selectedServices.value);
    for (const name of availableServices.value) {
      next.delete(name);
    }
    selectedServices.value = next;
  }

  return {
    availableServices,
    selectedServices: readonly(selectedServices),
    hasMultipleServices,
    toggleService,
    selectAll,
    deselectAll,
  };
}
