<script setup>
import { useFavorites } from '@/composables/useFavorites'

const { count } = useFavorites()

const links = [
  { to: '/', label: 'Inicio', icon: '🏠', exact: true },
  { to: '/favoritos', label: 'Favoritos', icon: '❤️' },
  { to: '/asistente', label: 'Asistente IA', short: 'IA', icon: '✨' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-800">
    <header class="sticky top-0 z-20 bg-red-600 text-white shadow">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span
            class="relative inline-block h-7 w-7 overflow-hidden rounded-full border-2 border-slate-900 bg-white"
            aria-hidden="true"
          >
            <span class="absolute inset-x-0 top-0 h-1/2 bg-red-500"></span>
            <span class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-900"></span>
            <span
              class="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-white"
            ></span>
          </span>
          Pokédex
        </RouterLink>

        <nav aria-label="Principal">
          <ul class="grid grid-cols-3 gap-1 text-sm sm:flex sm:gap-2">
            <li v-for="link in links" :key="link.to">
              <RouterLink
                :to="link.to"
                class="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-medium whitespace-nowrap text-red-50 transition hover:bg-red-500"
                :active-class="link.exact ? '' : 'nav-active'"
                :exact-active-class="link.exact ? 'nav-active' : ''"
              >
                <span aria-hidden="true">{{ link.icon }}</span>
                <span v-if="link.short" class="sm:hidden">{{ link.short }}</span>
                <span :class="link.short ? 'hidden sm:inline' : ''">{{ link.label }}</span>
                <span
                  v-if="link.to === '/favoritos' && count"
                  class="rounded-full bg-white px-1.5 text-xs font-bold text-red-600"
                >
                  {{ count }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 lg:py-8">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.name" />
        </Transition>
      </RouterView>
    </main>

    <footer class="py-6 text-center text-xs text-slate-400">
      Datos de <a href="https://pokeapi.co/" class="underline" target="_blank" rel="noopener">PokéAPI</a>
    </footer>
  </div>
</template>

<style scoped>
/* Enlace activo resaltado */
.nav-active {
  background-color: white;
  color: var(--color-red-600);
}
.nav-active:hover {
  background-color: white;
}
</style>
