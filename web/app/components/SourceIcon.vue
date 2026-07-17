<template>
  <component
    :is="icon"
    :title="`Source: ${getSourceLabel(source)}`"
    :class="color"
  />
</template>

<script setup lang="ts">
import type { TraceSource } from '@types';
import SentryIcon from '~icons/catppuccin/sentry';
import OtelIcon from '~icons/devicon-plain/opentelemetry';

interface Props {
  source: TraceSource;
}

const ICONS: Record<TraceSource, Component> = {
  OTLP: OtelIcon,
  SENTRY: SentryIcon,
};

const COLORS: Record<TraceSource, string> = {
  OTLP: 'text-blue-400',
  SENTRY: '',
};

const props = defineProps<Props>();

const icon = computed(() => ICONS[props.source]);
const color = computed(() => COLORS[props.source]);
</script>
