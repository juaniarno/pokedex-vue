// Inicialización de Firebase y del modelo de Gemini mediante Firebase AI Logic.
// La API key de Gemini NO está en el código: la administra Firebase.
// Las variables VITE_FIREBASE_* son la configuración pública de la app web de Firebase.
import { initializeApp } from 'firebase/app'
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite'

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

// Esquema de la respuesta: Gemini devuelve JSON con esta forma
const recommendationSchema = Schema.object({
  properties: {
    message: Schema.string(),
    recommendations: Schema.array({
      items: Schema.object({
        properties: {
          name: Schema.string(),
          reason: Schema.string(),
        },
      }),
    }),
  },
})

let model = null

function getModel() {
  if (!isFirebaseConfigured) return null
  if (!model) {
    const app = initializeApp(firebaseConfig)
    // GoogleAIBackend = Gemini Developer API, disponible en el plan Spark (gratuito)
    const ai = getAI(app, { backend: new GoogleAIBackend() })
    model = getGenerativeModel(ai, {
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recommendationSchema,
        temperature: 0.7,
      },
    })
  }
  return model
}

/** true si el error indica que se alcanzó la cuota del plan gratuito. */
export function isQuotaError(error) {
  const status = error?.customErrorData?.status ?? error?.status
  const text = `${error?.message ?? ''} ${error?.customErrorData?.statusText ?? ''}`
  return status === 429 || /quota|resource.?exhausted|rate.?limit|429/i.test(text)
}

/**
 * Pide recomendaciones a Gemini.
 * @param {string} request pedido del usuario en texto libre
 * @param {string[]} catalog líneas "nombre: tipo1, tipo2" con los Pokémon ya cargados
 */
export async function askForRecommendations(request, catalog) {
  const generativeModel = getModel()
  if (!generativeModel) {
    throw new Error(
      'El asistente no está configurado. Completá las variables VITE_FIREBASE_* del archivo .env.',
    )
  }

  const prompt = `Sos un asistente experto en Pokémon dentro de una Pokédex web.
El usuario hace un pedido en lenguaje natural y vos recomendás entre 3 y 6 Pokémon.

Reglas:
- Solo podés recomendar Pokémon que estén en el CATÁLOGO de abajo. Usá el nombre exactamente como aparece.
- Para cada uno explicá en una oración corta en español rioplatense por qué encaja con el pedido.
- En "message" escribí una introducción breve (una o dos oraciones) en español.
- Si el pedido no tiene relación con Pokémon, devolvé "recommendations" vacío y explicalo en "message".

CATÁLOGO (nombre: tipos):
${catalog.join('\n')}

PEDIDO DEL USUARIO:
${request}`

  const result = await generativeModel.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text)
}
