<script setup>
defineProps({
  title: { type: String, default: 'Algo salió mal' },
  message: { type: String, default: 'No se pudieron cargar los datos.' },
  retryable: { type: Boolean, default: true },
})
defineEmits(['retry'])
</script>

<template>
  <div
    class="mx-auto my-8 max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
    role="alert"
  >
    <p class="text-3xl" aria-hidden="true">⚠️</p>
    <h2 class="mt-2 font-semibold text-red-800">{{ title }}</h2>
    <p class="mt-1 text-sm text-red-700">{{ message }}</p>
    <button
      v-if="retryable"
      type="button"
      class="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300 focus:outline-none"
      @click="$emit('retry')"
    >
      Reintentar
    </button>
    <slot />
  </div>
</template>
