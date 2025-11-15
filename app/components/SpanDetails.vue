<template>
  <div class="span-details">
    <div class="span-details-header">
      <h2>Span Details</h2>
      <button @click="$emit('close')" class="close-btn" title="Close">×</button>
    </div>

    <div class="span-details-content">
      <!-- Span Info -->
      <section class="details-section">
        <h3>Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name</span>
            <span class="info-value">{{ span.name }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Span ID</span>
            <span class="info-value code">{{ span.span_id }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Trace ID</span>
            <span class="info-value code">{{ span.trace_id }}</span>
          </div>

          <div class="info-item" v-if="span.parent_span_id">
            <span class="info-label">Parent Span ID</span>
            <span class="info-value code">{{ span.parent_span_id }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Kind</span>
            <span class="info-value">
              <span
                class="kind-badge"
                :class="`kind-${getSpanKindClass(span.kind)}`"
              >
                {{ getSpanKindLabel(span.kind) }}
              </span>
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">Status</span>
            <span class="info-value">
              <span
                class="status-badge"
                :class="`status-${getStatusColor(span.status_code)}`"
              >
                {{ getStatusLabel(span.status_code) }}
              </span>
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">Duration</span>
            <span class="info-value">{{ formatDuration(span.duration) }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Start Time</span>
            <span class="info-value">{{
              formatTimestamp(span.start_time)
            }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">End Time</span>
            <span class="info-value">{{ formatTimestamp(span.end_time) }}</span>
          </div>
        </div>

        <div
          v-if="span.status_code === 2 && span.status_message"
          class="error-message"
        >
          <strong>Error Message:</strong>
          <p>{{ span.status_message }}</p>
        </div>
      </section>

      <!-- Attributes -->
      <section
        class="details-section"
        v-if="parsedAttributes && Object.keys(parsedAttributes).length > 0"
      >
        <h3>Attributes</h3>
        <div class="attributes-list">
          <div
            v-for="(value, key) in parsedAttributes"
            :key="key"
            class="attribute-item"
          >
            <span class="attribute-key">{{ key }}</span>
            <span class="attribute-value">{{
              formatAttributeValue(value)
            }}</span>
          </div>
        </div>
      </section>

      <!-- Events -->
      <section
        class="details-section"
        v-if="parsedEvents && parsedEvents.length > 0"
      >
        <h3>Events ({{ parsedEvents.length }})</h3>
        <div class="events-list">
          <div
            v-for="(event, idx) in parsedEvents"
            :key="idx"
            class="event-item"
          >
            <div class="event-header">
              <span class="event-name">{{ event.name }}</span>
              <span class="event-time">{{ formatTimestamp(event.time) }}</span>
            </div>
            <div
              v-if="
                event.attributes && Object.keys(event.attributes).length > 0
              "
              class="event-attributes"
            >
              <div
                v-for="(value, key) in event.attributes"
                :key="key"
                class="attribute-item"
              >
                <span class="attribute-key">{{ key }}</span>
                <span class="attribute-value">{{
                  formatAttributeValue(value)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Links -->
      <section
        class="details-section"
        v-if="parsedLinks && parsedLinks.length > 0"
      >
        <h3>Links ({{ parsedLinks.length }})</h3>
        <div class="links-list">
          <div v-for="(link, idx) in parsedLinks" :key="idx" class="link-item">
            <div class="link-info">
              <span class="info-label">Trace ID</span>
              <span class="info-value code">{{ link.traceId }}</span>
            </div>
            <div class="link-info">
              <span class="info-label">Span ID</span>
              <span class="info-value code">{{ link.spanId }}</span>
            </div>
            <div
              v-if="link.attributes && Object.keys(link.attributes).length > 0"
              class="link-attributes"
            >
              <div
                v-for="(value, key) in link.attributes"
                :key="key"
                class="attribute-item"
              >
                <span class="attribute-key">{{ key }}</span>
                <span class="attribute-value">{{
                  formatAttributeValue(value)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import type { Span } from '@types';

interface Props {
  span: Span;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
}>();

const parsedAttributes = computed(() => {
  try {
    return JSON.parse(props.span.attributes);
  } catch {
    return {};
  }
});

const parsedEvents = computed(() => {
  try {
    return JSON.parse(props.span.events);
  } catch {
    return [];
  }
});

const parsedLinks = computed(() => {
  try {
    return JSON.parse(props.span.links);
  } catch {
    return [];
  }
});

function getStatusLabel(code: SpanStatusCode): string {
  switch (code) {
    case SpanStatusCode.ERROR:
      return 'ERROR';
    case SpanStatusCode.OK:
    case SpanStatusCode.UNSET:
    default:
      return 'OK';
  }
}

function getSpanKindClass(kind: SpanKind): string {
  const classes: Record<SpanKind, string> = {
    [SpanKind.INTERNAL]: 'internal',
    [SpanKind.SERVER]: 'server',
    [SpanKind.CLIENT]: 'client',
    [SpanKind.PRODUCER]: 'producer',
    [SpanKind.CONSUMER]: 'consumer',
  };
  return classes[kind] || 'internal';
}

function formatAttributeValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
</script>

<style scoped>
.span-details {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.span-details-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.span-details-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #fafafa;
}

.close-btn {
  background: none;
  border: none;
  color: #71717a;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.15s;
}

.close-btn:hover {
  background: #27272a;
  color: #fafafa;
}

.span-details-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.details-section {
  margin-bottom: 2rem;
}

.details-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fafafa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  color: #e4e4e7;
  word-break: break-all;
}

.info-value.code {
  font-family:
    'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.75rem;
  color: #a1a1aa;
}

.kind-badge,
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.kind-badge.kind-server {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.kind-badge.kind-client {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.kind-badge.kind-internal {
  background: rgba(161, 161, 170, 0.1);
  color: #a1a1aa;
}

.kind-badge.kind-producer {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.kind-badge.kind-consumer {
  background: rgba(251, 146, 60, 0.1);
  color: #fb923c;
}

.status-badge.status-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.status-error {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.status-badge.status-default {
  background: rgba(161, 161, 170, 0.1);
  color: #a1a1aa;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.1);
  border-left: 3px solid #dc2626;
  border-radius: 0.375rem;
}

.error-message strong {
  color: #dc2626;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.5rem;
}

.error-message p {
  color: #fca5a5;
  font-size: 0.875rem;
  margin: 0;
}

.attributes-list,
.events-list,
.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attribute-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1rem;
  padding: 0.5rem;
  background: #0f0f11;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.attribute-key {
  color: #a1a1aa;
  font-family:
    'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.75rem;
  word-break: break-word;
}

.attribute-value {
  color: #e4e4e7;
  word-break: break-all;
  font-family:
    'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
}

.event-item,
.link-item {
  padding: 1rem;
  background: #0f0f11;
  border-radius: 0.375rem;
  border-left: 3px solid #3b82f6;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.event-name {
  font-weight: 500;
  color: #fafafa;
  font-size: 0.875rem;
}

.event-time {
  font-size: 0.75rem;
  color: #71717a;
  font-family:
    'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
}

.event-attributes,
.link-attributes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.link-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}
</style>
