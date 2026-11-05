// Acceso a PokéAPI (https://pokeapi.co/) usando fetch.
// Las respuestas se guardan en memoria para no repetir pedidos al navegar.

const BASE_URL = 'https://pokeapi.co/api/v2'

// Pokémon de la Pokédex nacional (sin formas alternativas, que tienen id > 10000)
export const MAX_POKEMON_ID = 1025

// Tipos que la API devuelve pero que no tienen Pokémon asociados
const TIPOS_EXCLUIDOS = ['unknown', 'shadow', 'stellar']

const cache = new Map()

async function getJSON(path) {
  if (cache.has(path)) return cache.get(path)

  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    const error = new Error(
      response.status === 404
        ? 'No se encontró el recurso solicitado.'
        : `La API respondió con un error (${response.status}).`,
    )
    error.status = response.status
    throw error
  }
  const data = await response.json()
  cache.set(path, data)
  return data
}

export function idFromUrl(url) {
  const parts = url.split('/').filter(Boolean)
  return Number(parts[parts.length - 1])
}

export function imageUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function toListItem({ name, url }) {
  const id = idFromUrl(url)
  return { id, name, image: imageUrl(id) }
}

/** Listado completo (nombre, id e imagen) de los Pokémon de la Pokédex nacional. */
export async function fetchPokemonList() {
  const data = await getJSON(`/pokemon?limit=${MAX_POKEMON_ID}&offset=0`)
  return data.results.map(toListItem).filter((p) => p.id <= MAX_POKEMON_ID)
}

/** Lista de tipos disponibles para el filtro. */
export async function fetchTypes() {
  const data = await getJSON('/type?limit=100')
  return data.results.map((t) => t.name).filter((name) => !TIPOS_EXCLUIDOS.includes(name))
}

/** Nombres de los Pokémon que pertenecen a un tipo. */
export async function fetchPokemonNamesByType(type) {
  const data = await getJSON(`/type/${type}`)
  return data.pokemon
    .map(({ pokemon }) => pokemon)
    .filter((p) => idFromUrl(p.url) <= MAX_POKEMON_ID)
    .map((p) => p.name)
}

function cleanText(text) {
  return text.replace(/[\n\f­]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Detalle de un Pokémon: datos de /pokemon y descripción de /pokemon-species. */
export async function fetchPokemonDetail(idOrName) {
  const pokemon = await getJSON(`/pokemon/${String(idOrName).toLowerCase()}`)
  const species = await getJSON(`/pokemon-species/${pokemon.species.name}`)

  const flavor =
    species.flavor_text_entries.find((f) => f.language.name === 'es') ??
    species.flavor_text_entries.find((f) => f.language.name === 'en')
  const genus =
    species.genera.find((g) => g.language.name === 'es') ??
    species.genera.find((g) => g.language.name === 'en')

  return {
    id: pokemon.id,
    name: pokemon.name,
    image: pokemon.sprites.other?.['official-artwork']?.front_default ?? imageUrl(pokemon.id),
    types: pokemon.types.map((t) => t.type.name),
    height: pokemon.height / 10, // decímetros -> metros
    weight: pokemon.weight / 10, // hectogramos -> kilos
    abilities: pokemon.abilities.map((a) => a.ability.name),
    stats: pokemon.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    description: flavor ? cleanText(flavor.flavor_text) : 'Sin descripción disponible.',
    genus: genus?.genus ?? '',
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
  }
}
