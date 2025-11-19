import type { InjectionKey } from 'vue';

interface LiveModeInstance {
  liveMode: Ref<boolean>;
}

const LIVE_MODE_KEY: InjectionKey<LiveModeInstance> = Symbol('liveMode');

function _useLiveMode() {
  const liveMode = ref(true);

  const liveModeInstance: LiveModeInstance = {
    liveMode,
  };

  provide(LIVE_MODE_KEY, liveModeInstance);

  return liveModeInstance;
}

export function useLiveMode() {
  return inject(LIVE_MODE_KEY, _useLiveMode, true);
}
