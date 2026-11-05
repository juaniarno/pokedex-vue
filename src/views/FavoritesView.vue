<script setup>
import { onBeforeUnmount, ref } from 'vue'
import PokemonCard from '@/components/PokemonCard.vue'
import { useFavorites } from '@/composables/useFavorites'
import { formatName } from '@/utils/labels'

const { favorites, removeFavorite } = useFavorites()

// Último eliminado, para poder deshacer (vuelve a entrar con animación)
const lastRemoved = ref(null)
let undoTimer

function remove(pokemon) {
  const index = favorites.value.findIndex((f) => f.id === pokemon.id)
  removeFavorite(pokemon.id)
  lastRemoved.value = { pokemon, index }
  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => (lastRemoved.value = null), 5000)
}

function undo() {
  if (!lastRemoved.value) return
  const { pokemon, index } = lastRemoved.value
  favorites.value.splice(index, 0, pokemon)
  lastRemoved.value = null
  clearTimeout(undoTimer)
}

onBeforeUnmount(() => clearTimeout(undoTimer))
</script>

<template>
  <section>
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Mis favoritos</h1>
      <p class="mt-1 text-sm text-slate-500">
        Se guardan en este navegador (localStorage).
        <template v-if="favorites.length">Tenés {{ favorites.length }}.</template>
      </p>
    </div>

    <div
      v-if="!favorites.length"
      class="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200"
    >
      <p class="text-4xl" aria-hidden="true">🤍</p>
      <p class="mt-2">Todavía no agregaste favoritos.</p>
      <RouterLink to="/" class="mt-3 inline-block font-semibold text-red-600 underline">
        Explorar la Pokédex
      </RouterLink>
    </div>

    <TransitionGroup
      name="fav"
      tag="ul"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    >
      <li v-for="pokemon in favorites" :key="pokemon.id">
        <PokemonCard :pokemon="pokemon">
          <template #actions>
            <button
              type="button"
              class="w-full rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              :aria-label="`Quitar ${formatName(pokemon.name)} de favoritos`"
              @click="remove(pokemon)"
            >
              Quitar
            </button>
          </template>
        </PokemonCard>
      </li>
    </TransitionGroup>

    <Transition name="toast">
      <div
        v-if="lastRemoved"
        class="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        role="status"
      >
        <span>Quitaste a {{ formatName(lastRemoved.pokemon.name) }}</span>
        <button type="button" class="font-semibold text-red-300 hover:text-red-200" @click="undo">
          Deshacer
        </button>
      </div>
    </Transition>
  </section>
</template>
