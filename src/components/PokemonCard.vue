<script setup>
import { ref } from 'vue'
import TypeBadge from './TypeBadge.vue'
import { formatName, formatNumber } from '@/utils/labels'

defineProps({
  pokemon: { type: Object, required: true },
})

const imageFailed = ref(false)
</script>

<template>
  <article
    class="group relative flex h-full flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <RouterLink
      :to="{ name: 'detalle', params: { id: pokemon.id } }"
      class="flex flex-1 flex-col items-center text-center focus:outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-red-400"
    >
      <div class="flex aspect-square w-full items-center justify-center rounded-xl bg-slate-50">
        <img
          v-if="!imageFailed"
          :src="pokemon.image"
          :alt="formatName(pokemon.name)"
          loading="lazy"
          width="160"
          height="160"
          class="h-4/5 w-4/5 object-contain transition group-hover:scale-105"
          @error="imageFailed = true"
        />
        <span v-else class="text-4xl text-slate-300" aria-hidden="true">?</span>
      </div>
      <span class="mt-2 text-xs font-medium text-slate-400">{{ formatNumber(pokemon.id) }}</span>
      <h3 class="text-sm font-semibold text-slate-800 sm:text-base">
        {{ formatName(pokemon.name) }}
      </h3>
    </RouterLink>
    <div v-if="pokemon.types?.length" class="mt-2 flex justify-center gap-1">
      <TypeBadge v-for="type in pokemon.types" :key="type" :type="type" />
    </div>
    <!-- Acciones extra (ej. quitar de favoritos), por encima del enlace -->
    <div v-if="$slots.actions" class="relative z-10 mt-3">
      <slot name="actions" />
    </div>
  </article>
</template>
