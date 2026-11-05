// Estado compartido del listado de Pokémon y del índice de tipos.
// Al ser estado a nivel de módulo, lo comparten la página de inicio y el asistente de IA,
// así el asistente usa como contexto los datos que la app ya cargó.
import { ref, shallowRef } from 'vue'
import { fetchPokemonList, fetchPokemonNamesByType, fetchTypes } from '@/services/pokeapi'

const pokemonList = shallowRef([])
const listLoading = ref(false)
const listError = ref(null)

const types = ref([])
const typesLoading = ref(false)
const typesError = ref(null)

// tipo -> Set de nombres de Pokémon
const typeMembers = shallowRef(new Map())

async function loadList() {
  if (pokemonList.value.length || listLoading.value) return
  listLoading.value = true
  listError.value = null
  try {
    pokemonList.value = await fetchPokemonList()
  } catch (error) {
    listError.value = error.message || 'No se pudo cargar el listado.'
  } finally {
    listLoading.value = false
  }
}

async function loadTypes() {
  if (types.value.length || typesLoading.value) return
  typesLoading.value = true
  typesError.value = null
  try {
    types.value = await fetchTypes()
  } catch (error) {
    typesError.value = error.message || 'No se pudieron cargar los tipos.'
  } finally {
    typesLoading.value = false
  }
}

/** Devuelve el Set de nombres de un tipo, pidiéndolo a la API si hace falta. */
async function loadTypeMembers(type) {
  if (typeMembers.value.has(type)) return typeMembers.value.get(type)
  const names = new Set(await fetchPokemonNamesByType(type))
  const next = new Map(typeMembers.value)
  next.set(type, names)
  typeMembers.value = next
  return names
}

/** Carga todos los tipos para saber el tipo de cada Pokémon (lo usa el asistente). */
async function loadAllTypeMembers() {
  await loadTypes()
  if (typesError.value) throw new Error(typesError.value)
  await Promise.all(types.value.map((t) => loadTypeMembers(t)))
}

function typesOf(name) {
  const result = []
  for (const [type, names] of typeMembers.value) {
    if (names.has(name)) result.push(type)
  }
  return result
}

export function usePokemonList() {
  return {
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
    loadAllTypeMembers,
    typesOf,
  }
}
