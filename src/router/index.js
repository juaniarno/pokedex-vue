import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: HomeView,
      meta: { title: 'Inicio' },
    },
    {
      path: '/detalle/:id(\\d+)',
      name: 'detalle',
      component: () => import('../views/DetailView.vue'),
      props: true,
      meta: { title: 'Detalle' },
    },
    {
      path: '/favoritos',
      name: 'favoritos',
      component: () => import('../views/FavoritesView.vue'),
      meta: { title: 'Favoritos' },
    },
    {
      path: '/asistente',
      name: 'asistente',
      component: () => import('../views/AssistantView.vue'),
      meta: { title: 'Asistente IA' },
    },
    // Ruta "no encontrado": cualquier otra URL redirige al inicio
    {
      path: '/:pathMatch(.*)*',
      name: 'no-encontrado',
      redirect: { name: 'inicio' },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Cambios de query en el inicio (búsqueda/filtro) no mueven el scroll
    if (to.name === from.name && to.name === 'inicio') return false
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Pokédex` : 'Pokédex'
})

export default router
