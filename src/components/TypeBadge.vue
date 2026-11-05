<script setup>
import { TYPE_COLORS, typeLabel } from '@/utils/labels'

defineProps({
  type: { type: String, required: true },
})
</script>

<template>
  <span
    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
    :class="TYPE_COLORS[type] ?? 'bg-slate-400'"
  >
    {{ typeLabel(type) }}
  </span>
</template>
