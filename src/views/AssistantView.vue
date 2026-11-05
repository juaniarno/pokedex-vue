<script setup>
import { computed, onMounted, ref } from 'vue'
import PokemonCard from '@/components/PokemonCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import { usePokemonList } from '@/composables/usePokemonList'
import { askForRecommendations, isFirebaseConfigured, isQuotaError } from '@/services/firebase'

const EXAMPLES = [
  'Un equipo para ganarle a un Pokémon de agua',
  'Pokémon tiernos para alguien que recién empieza',
  'Algo que dé miedo, tipo fantasma o siniestro',
  'Dragones poderosos',
]

const { pokemonList, listLoading, listError, loadList, loadAllTypeMembers, typesOf } =
  usePokemonList()

// --- Contexto: los Pokémon que la app ya cargó, con sus tipos ---
const contextLoading = ref(false)
const contextError = ref(null)

async function loadContext() {
  contextLoading.value = true
  contextError.value = null
  try {
    await loadList()
    if (listError.value) throw new Error(listError.value)
    await loadAllTypeMembers()
  } catch (error) {
    contextError.value = error.message || 'No se pudieron cargar los datos.'
  } finally {
    contextLoading.value = false
  }
}

const ready = computed(
  () => pokemonList.value.length && !contextLoading.value && !contextError.value,
)

// --- Pedido a la IA ---
const request = ref('')
const lastRequest = ref('')
const asking = ref(false)
const aiError = ref(null)
const quotaReached = ref(false)
const answer = ref(null)

function normalizeName(name) {
  return name.trim().toLowerCase().replace(/[\s.']+/g, '-').replace(/-+/g, '-')
}

async function ask(text = request.value) {
  const prompt = text.trim()
  if (!prompt || asking.value) return
  request.value = prompt
  lastRequest.value = prompt
  asking.value = true
  aiError.value = null
  quotaReached.value = false
  answer.value = null

  try {
    const catalog = pokemonList.value.map((p) => `${p.name}: ${typesOf(p.name).join(', ')}`)
    const result = await askForRecommendations(prompt, catalog)

    // Solo se muestran Pokémon que existen en los datos cargados
    const byName = new Map(pokemonList.value.map((p) => [p.name, p]))
    const seen = new Set()
    const recommendations = (result.recommendations ?? [])
      .map((r) => {
        const pokemon = byName.get(normalizeName(r.name ?? ''))
        return pokemon ? { ...pokemon, types: typesOf(pokemon.name), reason: r.reason } : null
      })
      .filter((p) => p && !seen.has(p.id) && seen.add(p.id))

    answer.value = { message: result.message ?? '', recommendations }
  } catch (error) {
    console.warn('Error del asistente de IA:', error)
    if (isQuotaError(error)) {
      quotaReached.value = true
      aiError.value =
        'Se alcanzó el límite de uso gratuito de Gemini. Esperá unos minutos y volvé a intentar.'
    } else if (error instanceof SyntaxError) {
      aiError.value = 'La IA devolvió una respuesta inválida. Probá de nuevo.'
    } else {
      aiError.value = error.message || 'No se pudo obtener una respuesta de la IA.'
    }
  } finally {
    asking.value = false
  }
}

onMounted(loadContext)
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <div class="mb-5">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">✨ Asistente Pokémon</h1>
      <p class="mt-1 text-sm text-slate-500">
        Contale qué buscás y Gemini te recomienda Pokémon de la Pokédex, usando como contexto los
        datos que la app ya cargó.
      </p>
    </div>

    <div
      v-if="!isFirebaseConfigured"
      class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      role="alert"
    >
      El asistente no está configurado: faltan las variables <code>VITE_FIREBASE_*</code> en el
      archivo <code>.env</code> (ver README).
    </div>

    <LoadingState
      v-if="contextLoading || listLoading"
      message="Preparando los datos para el asistente..."
    />
    <ErrorState
      v-else-if="contextError"
      title="No se pudieron cargar los datos"
      :message="contextError"
      @retry="loadContext"
    />

    <template v-else-if="ready">
      <form
        class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
        @submit.prevent="ask()"
      >
        <label for="ai-request" class="mb-2 block text-sm font-semibold text-slate-700">
          ¿Qué estás buscando?
        </label>
        <textarea
          id="ai-request"
          v-model="request"
          rows="3"
          maxlength="500"
          placeholder="Ej: un Pokémon rápido de tipo eléctrico para mi equipo"
          class="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-base focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none"
          @keydown.enter.exact.prevent="ask()"
        ></textarea>

        <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="example in EXAMPLES"
              :key="example"
              type="button"
              class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              :disabled="asking"
              @click="ask(example)"
            >
              {{ example }}
            </button>
          </div>
          <button
            type="submit"
            class="shrink-0 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
            :disabled="asking || !request.trim() || !isFirebaseConfigured"
          >
            {{ asking ? 'Pensando...' : 'Recomendar' }}
          </button>
        </div>
      </form>

      <LoadingState v-if="asking" message="Gemini está buscando Pokémon para vos..." />

      <ErrorState
        v-else-if="aiError"
        :title="quotaReached ? 'Límite de uso alcanzado' : 'El asistente no pudo responder'"
        :message="aiError"
        @retry="ask(lastRequest)"
      />

      <div v-else-if="answer" class="mt-6">
        <p class="rounded-2xl bg-red-50 p-4 text-slate-700">{{ answer.message }}</p>
        <ul
          v-if="answer.recommendations.length"
          class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3"
        >
          <li v-for="pokemon in answer.recommendations" :key="pokemon.id">
            <PokemonCard :pokemon="pokemon">
              <template #actions>
                <p class="text-center text-xs text-slate-600 sm:text-sm">{{ pokemon.reason }}</p>
              </template>
            </PokemonCard>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
