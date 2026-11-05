// Favoritos guardados en localStorage.
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'pokedex-favoritos'

function readStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const favorites = ref(readStorage())

watch(
  favorites,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Sin acceso a localStorage (modo privado, etc.): se mantiene solo en memoria
    }
  },
  { deep: true },
)

// Sincroniza si se modifican los favoritos en otra pestaña
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) favorites.value = readStorage()
  })
}

export function useFavorites() {
  const count = computed(() => favorites.value.length)

  function isFavorite(id) {
    return favorites.value.some((f) => f.id === Number(id))
  }

  function addFavorite(pokemon) {
    if (isFavorite(pokemon.id)) return
    favorites.value.push({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.image,
      types: pokemon.types ?? [],
    })
  }

  function removeFavorite(id) {
    favorites.value = favorites.value.filter((f) => f.id !== Number(id))
  }

  function toggleFavorite(pokemon) {
    if (isFavorite(pokemon.id)) removeFavorite(pokemon.id)
    else addFavorite(pokemon)
  }

  return { favorites, count, isFavorite, addFavorite, removeFavorite, toggleFavorite }
}
