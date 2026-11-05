<script setup>
defineProps({
  message: { type: String, default: 'Cargando...' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12 text-slate-500" role="status">
    <span
      class="h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-500"
      aria-hidden="true"
    ></span>
    <p class="text-sm">{{ message }}</p>
  </div>
</template>
