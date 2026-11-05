<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import TypeBadge from '@/components/TypeBadge.vue'
import { useFavorites } from '@/composables/useFavorites'
import { fetchPokemonDetail, MAX_POKEMON_ID } from '@/services/pokeapi'
import { formatName, formatNumber, STAT_LABELS } from '@/utils/labels'

const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()
const { isFavorite, toggleFavorite } = useFavorites()

const pokemon = ref(null)
const loading = ref(false)
const error = ref(null)
const notFound = ref(false)

const numericId = computed(() => Number(props.id))
const favorite = computed(() => pokemon.value && isFavorite(pokemon.value.id))
const totalStats = computed(() => pokemon.value?.stats.reduce((sum, s) => sum + s.value, 0) ?? 0)

async function load() {
  loading.value = true
  error.value = null
  notFound.value = false
  try {
    pokemon.value = await fetchPokemonDetail(props.id)
    document.title = `${formatName(pokemon.value.name)} · Pokédex`
  } catch (err) {
    pokemon.value = null
    notFound.value = err.status === 404
    error.value = err.message || 'No se pudo cargar el Pokémon.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
// Al pasar al anterior/siguiente se reutiliza el componente: recargar al cambiar el id
watch(() => props.id, load)

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'inicio' })
}
</script>

<template>
  <section>
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-red-600"
      @click="goBack"
    >
      ← Volver
    </button>

    <LoadingState v-if="loading" message="Cargando Pokémon..." />

    <ErrorState
      v-else-if="error"
      :title="notFound ? 'Pokémon no encontrado' : 'No se pudo cargar el Pokémon'"
      :message="notFound ? `No existe un Pokémon con el número ${id}.` : error"
      :retryable="!notFound"
      @retry="load"
    >
      <RouterLink v-if="notFound" to="/" class="mt-4 inline-block font-semibold text-red-700 underline">
        Ir al inicio
      </RouterLink>
    </ErrorState>

    <article
      v-else-if="pokemon"
      class="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 md:grid md:grid-cols-2"
    >
      <!-- Imagen -->
      <div class="relative flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-100 p-6 md:p-10">
        <img
          :src="pokemon.image"
          :alt="formatName(pokemon.name)"
          width="320"
          height="320"
          class="h-56 w-56 object-contain drop-shadow-lg sm:h-72 sm:w-72"
        />
        <span class="absolute top-4 left-4 text-sm font-bold text-slate-400">
          {{ formatNumber(pokemon.id) }}
        </span>
      </div>

      <!-- Datos -->
      <div class="p-5 sm:p-8">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-3xl font-bold text-slate-900">{{ formatName(pokemon.name) }}</h1>
          <span
            v-if="pokemon.isLegendary || pokemon.isMythical"
            class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
          >
            {{ pokemon.isMythical ? 'Singular' : 'Legendario' }}
          </span>
        </div>
        <p v-if="pokemon.genus" class="text-sm text-slate-500">{{ pokemon.genus }}</p>

        <div class="mt-3 flex gap-2">
          <TypeBadge v-for="type in pokemon.types" :key="type" :type="type" />
        </div>

        <p class="mt-4 leading-relaxed text-slate-700">{{ pokemon.description }}</p>

        <button
          type="button"
          class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow transition sm:w-auto"
          :class="
            favorite
              ? 'bg-white text-red-600 ring-2 ring-red-500 hover:bg-red-50'
              : 'bg-red-600 text-white hover:bg-red-700'
          "
          :aria-pressed="favorite"
          @click="toggleFavorite(pokemon)"
        >
          <span aria-hidden="true">{{ favorite ? '💔' : '❤️' }}</span>
          {{ favorite ? 'Quitar de favoritos' : 'Agregar a favoritos' }}
        </button>

        <dl class="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div class="rounded-xl bg-slate-50 p-3">
            <dt class="text-xs text-slate-500">Altura</dt>
            <dd class="font-semibold">{{ pokemon.height }} m</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <dt class="text-xs text-slate-500">Peso</dt>
            <dd class="font-semibold">{{ pokemon.weight }} kg</dd>
          </div>
          <div class="col-span-2 rounded-xl bg-slate-50 p-3 sm:col-span-1">
            <dt class="text-xs text-slate-500">Habilidades</dt>
            <dd class="font-semibold">{{ pokemon.abilities.map(formatName).join(', ') }}</dd>
          </div>
        </dl>

        <h2 class="mt-6 mb-2 font-semibold text-slate-900">Estadísticas base</h2>
        <ul class="space-y-2">
          <li v-for="stat in pokemon.stats" :key="stat.name" class="grid grid-cols-[7rem_2.5rem_1fr] items-center gap-2 text-sm">
            <span class="text-slate-500">{{ STAT_LABELS[stat.name] ?? stat.name }}</span>
            <span class="text-right font-semibold">{{ stat.value }}</span>
            <span class="h-2 overflow-hidden rounded-full bg-slate-100">
              <span
                class="block h-full rounded-full"
                :class="stat.value >= 100 ? 'bg-green-500' : stat.value >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                :style="{ width: `${Math.min(stat.value / 1.8, 100)}%` }"
              ></span>
            </span>
          </li>
          <li class="grid grid-cols-[7rem_2.5rem_1fr] gap-2 border-t border-slate-100 pt-2 text-sm">
            <span class="font-semibold">Total</span>
            <span class="text-right font-bold">{{ totalStats }}</span>
          </li>
        </ul>
      </div>
    </article>

    <!-- Navegación anterior / siguiente -->
    <nav v-if="!loading && !notFound" class="mt-5 flex justify-between text-sm" aria-label="Pokémon cercanos">
      <RouterLink
        v-if="numericId > 1"
        :to="{ name: 'detalle', params: { id: numericId - 1 } }"
        class="rounded-full bg-white px-4 py-2 font-medium shadow-sm ring-1 ring-slate-200 hover:text-red-600"
      >
        ← {{ formatNumber(numericId - 1) }}
      </RouterLink>
      <span v-else></span>
      <RouterLink
        v-if="numericId < MAX_POKEMON_ID"
        :to="{ name: 'detalle', params: { id: numericId + 1 } }"
        class="rounded-full bg-white px-4 py-2 font-medium shadow-sm ring-1 ring-slate-200 hover:text-red-600"
      >
        {{ formatNumber(numericId + 1) }} →
      </RouterLink>
    </nav>
  </section>
</template>
