/**
 * @file i18n.js
 * @description Archivo del sistema i18n.js.
 * @module Module
 * @path /frontend/src/i18n.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'
import pt from './locales/pt.json'
import fr from './locales/fr.json'

const resources = { 
  es: { translation: es }, 
  en: { translation: en },
  pt: { translation: pt },
  fr: { translation: fr }
}

// Detección automática de idioma
const getBrowserLang = () => {
  if (typeof window === 'undefined') return 'es'
  const lang = navigator.language || navigator.userLanguage
  if (lang.startsWith('es')) return 'es'
  if (lang.startsWith('pt')) return 'pt'
  if (lang.startsWith('fr')) return 'fr'
  return 'en'
}

const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null
const lng = saved || getBrowserLang()

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })

export default i18n
