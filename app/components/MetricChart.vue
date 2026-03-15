<template>
  <div class="w-full h-full" ref="chartContainer">
    <VisXYContainer :data="chartData" :height="height">
      <VisLine
        v-if="type !== 'histogram'"
        :x="(d: MetricDataPoint) => d.x"
        :y="(d: MetricDataPoint) => d.y"
        color="#3b82f6"
        :curveType="'linear'"
      />
      <VisArea
        v-if="type !== 'histogram'"
        :x="(d: MetricDataPoint) => d.x"
        :y="(d: MetricDataPoint) => d.y"
        color="#3b82f6"
        :opacity="0.1"
        :curveType="'linear'"
      />
      <VisScatter
        v-if="type !== 'histogram'"
        :x="(d: MetricDataPoint) => d.x"
        :y="(d: MetricDataPoint) => d.y"
        color="#3b82f6"
        :size="3"
      />
      <VisStackedBar
        v-if="type === 'histogram'"
        :x="(d: MetricDataPoint) => d.x"
        :y="(d: MetricDataPoint) => d.y"
        color="#3b82f6"
      />
      <VisAxis type="x" :tickFormat="formatTime" :gridLine="false" />
      <VisAxis type="y" :gridLine="true" />
      <VisCrosshair :template="tooltipTemplate" />
      <VisTooltip />
    </VisXYContainer>
  </div>
</template>

<script setup lang="ts">
import {
  VisXYContainer,
  VisLine,
  VisArea,
  VisScatter,
  VisStackedBar,
  VisAxis,
  VisCrosshair,
  VisTooltip,
} from '@unovis/vue';
import type { MetricType } from '../../shared/parsers/types';

interface MetricDataPoint {
  x: number;
  y: number;
  label?: string;
}

const props = defineProps<{
  dataPoints: MetricDataPoint[];
  type: MetricType;
  height?: number;
  unit?: string | null;
}>();

const height = computed(() => props.height ?? 200);

const chartData = computed(() => {
  if (!props.dataPoints.length) return [];
  return [...props.dataPoints].sort((a, b) => a.x - b.x);
});

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function tooltipTemplate(d: MetricDataPoint): string {
  const time = new Date(d.x).toLocaleTimeString();
  const unit = props.unit ? ` ${props.unit}` : '';
  return `<div class="text-xs">
    <div class="text-zinc-400">${time}</div>
    <div class="font-medium">${d.y}${unit}</div>
  </div>`;
}
</script>
