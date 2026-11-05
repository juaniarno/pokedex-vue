// Traducciones y colores para mostrar los datos de la API en español.

export const TYPE_LABELS = {
  normal: 'Normal',
  fighting: 'Lucha',
  flying: 'Volador',
  poison: 'Veneno',
  ground: 'Tierra',
  rock: 'Roca',
  bug: 'Bicho',
  ghost: 'Fantasma',
  steel: 'Acero',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  psychic: 'Psíquico',
  ice: 'Hielo',
  dragon: 'Dragón',
  dark: 'Siniestro',
  fairy: 'Hada',
}

export const TYPE_COLORS = {
  normal: 'bg-stone-400',
  fighting: 'bg-orange-700',
  flying: 'bg-indigo-400',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  rock: 'bg-yellow-700',
  bug: 'bg-lime-600',
  ghost: 'bg-violet-700',
  steel: 'bg-slate-500',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400 text-yellow-950',
  psychic: 'bg-pink-500',
  ice: 'bg-cyan-400 text-cyan-950',
  dragon: 'bg-indigo-700',
  dark: 'bg-neutral-700',
  fairy: 'bg-pink-300 text-pink-950',
}

export const STAT_LABELS = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. Especial',
  'special-defense': 'Def. Especial',
  speed: 'Velocidad',
}

export function typeLabel(type) {
  return TYPE_LABELS[type] ?? type
}

export function formatName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatNumber(id) {
  return `#${String(id).padStart(4, '0')}`
}
