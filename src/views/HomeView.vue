<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PokemonCard from '@/components/PokemonCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import { usePokemonList } from '@/composables/usePokemonList'
import { debounce } from '@/utils/debounce'
import { typeLabel } from '@/utils/labels'

const PAGE_SIZE = 24

const route = useRoute()
const router = useRouter()

const {
  pokemonList,
  listLoading,
  listError,
  loadList,
  types,
  typesLoading,
  typesError,
  loadTypes,
  typeMembers,
  loadTypeMembers,
} = usePokemonList()

// --- Búsqueda y filtro sincronizados con la URL (?q=...&tipo=...) ---
const search = computed(() => String(route.query.q ?? ''))
const selectedType = computed(() => String(route.query.tipo ?? ''))

// Lo que escribe el usuario; se pasa a la URL con debounce
const searchInput = ref(search.value)

function updateQuery(changes) {
  // Durante la transición de salida el componente sigue montado: no tocar otra ruta
  if (route.name !== 'inicio') return
  const query = { ...route.query, ...changes }
  for (const key of Object.keys(query)) {
    if (!query[key]) delete query[key]
  }
  router.replace({ query })
}

const pushSearch = debounce((value) => updateQuery({ q: value.trim() }), 350)

watch(searchInput, (value) => pushSearch(value))

// Si la URL cambia desde afuera (atrás/adelante, link compartido), actualiza el input
watch(search, (value) => {
  if (route.name !== 'inicio') return
  if (value !== searchInput.value.trim()) searchInput.value = value
})

function onTypeChange(event) {
  updateQuery({ tipo: event.target.value })
}

function clearFilters() {
  pushSearch.cancel()
  searchInput.value = ''
  updateQuery({ q: '', tipo: '' })
}

// --- Carga de los Pokémon del tipo seleccionado ---
const typeLoading = ref(false)
const typeError = ref(null)

async function loadSelectedType() {
  if (!selectedType.value) return
  typeLoading.value = true
  typeError.value = null
  try {
    await loadTypeMembers(selectedType.value)
  } catch (error) {
    typeError.value = error.message || 'No se pudo cargar el tipo seleccionado.'
  } finally {
    typeLoading.value = false
  }
}

watch(selectedType, loadSelectedType)

// --- Resultados filtrados (computed) ---
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}

const filteredPokemon = computed(() => {
  const term = normalize(search.value.trim())
  const typeSet = selectedType.value ? typeMembers.value.get(selectedType.value) : null

  return pokemonList.value.filter((pokemon) => {
    if (typeSet && !typeSet.has(pokemon.name)) return false
    if (!term) return true
    // Busca por nombre o por número de Pokédex
    return pokemon.name.includes(term) || String(pokemon.id) === term.replace(/^#0*/, '')
  })
})

// --- Carga incremental ---
const visibleCount = ref(PAGE_SIZE)
const visiblePokemon = computed(() => filteredPokemon.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filteredPokemon.value.length)

function loadMore() {
  visibleCount.value += PAGE_SIZE
}

watch([search, selectedType], () => {
  visibleCount.value = PAGE_SIZE
})

// Carga automática al llegar al final de la lista (además del botón)
const sentinel = ref(null)
let observer = null

watch(sentinel, (element) => {
  observer?.disconnect()
  if (!element) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value) loadMore()
    },
    { rootMargin: '300px' },
  )
  observer.observe(element)
})

const showingType = computed(() => selectedType.value && !typeLoading.value && !typeError.value)

// --- Ciclo de vida ---
onMounted(() => {
  loadList()
  loadTypes()
  loadSelectedType()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  pushSearch.cancel()
})
</script>

<template>
  <section>
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Explorá la Pokédex</h1>
      <p class="mt-1 text-sm text-slate-500">
        Buscá por nombre o número y filtrá por tipo. Tocá un Pokémon para ver su detalle.
      </p>
    </div>

    <!-- Barra de búsqueda y filtro -->
    <form
      class="grid gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
      role="search"
      @submit.prevent="updateQuery({ q: searchInput.trim() })"
    >
      <label class="block">
        <span class="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Nombre o número
        </span>
        <input
          v-model="searchInput"
          type="search"
          placeholder="Ej: pikachu, char, 25..."
          autocomplete="off"
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Tipo
        </span>
        <select
          :value="selectedType"
          :disabled="typesLoading || !!typesError"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:opacity-50"
          @change="onTypeChange"
        >
          <option value="">{{ typesLoading ? 'Cargando tipos...' : 'Todos los tipos' }}</option>
          <option v-for="type in types" :key="type" :value="type">{{ typeLabel(type) }}</option>
        </select>
      </label>

      <button
        type="button"
        class="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
        :disabled="!search && !selectedType && !searchInput"
        @click="clearFilters"
      >
        Limpiar
      </button>
    </form>

    <p v-if="typesError" class="mt-2 text-sm text-red-600">
      No se pudieron cargar los tipos.
      <button type="button" class="font-semibold underline" @click="loadTypes">Reintentar</button>
    </p>

    <!-- Estados de carga / error -->
    <LoadingState v-if="listLoading" message="Cargando Pokémon..." />
    <ErrorState
      v-else-if="listError"
      title="No se pudo cargar la Pokédex"
      :message="listError"
      @retry="loadList"
    />
    <LoadingState v-else-if="typeLoading" message="Filtrando por tipo..." />
    <ErrorState
      v-else-if="typeError"
      title="No se pudo aplicar el filtro"
      :message="typeError"
      @retry="loadSelectedType"
    />

    <!-- Resultados -->
    <template v-else-if="pokemonList.length">
      <p class="mt-5 mb-3 text-sm text-slate-500" aria-live="polite">
        <template v-if="search || showingType">
          {{ filteredPokemon.length }} resultado{{ filteredPokemon.length === 1 ? '' : 's' }}
          <template v-if="search"> para «{{ search }}»</template>
          <template v-if="showingType"> de tipo {{ typeLabel(selectedType) }}</template>
        </template>
        <template v-else>{{ pokemonList.length }} Pokémon en la Pokédex nacional</template>
      </p>

      <div
        v-if="!filteredPokemon.length"
        class="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200"
      >
        <p class="text-3xl" aria-hidden="true">🔍</p>
        <p class="mt-2">No encontramos Pokémon con esos criterios.</p>
        <button type="button" class="mt-3 font-semibold text-red-600 underline" @click="clearFilters">
          Limpiar búsqueda
        </button>
      </div>

      <ul v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <li v-for="pokemon in visiblePokemon" :key="pokemon.id">
          <PokemonCard :pokemon="pokemon" />
        </li>
      </ul>

      <div v-if="hasMore" ref="sentinel" class="mt-6 flex justify-center">
        <button
          type="button"
          class="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700"
          @click="loadMore"
        >
          Cargar más ({{ visiblePokemon.length }} de {{ filteredPokemon.length }})
        </button>
      </div>
    </template>
  </section>
</template>
