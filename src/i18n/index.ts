import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import ja from './ja.json';
import en from './en.json';

const LANG_KEY = 'app_language';

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: 'ja',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Restore saved language preference (async, called on app start)
export async function restoreLanguage() {
  const saved = await SecureStore.getItemAsync(LANG_KEY);
  if (saved && (saved === 'ja' || saved === 'en')) {
    await i18n.changeLanguage(saved);
  }
}

// Change language and persist the choice
export async function setLanguage(lng: 'ja' | 'en') {
  await i18n.changeLanguage(lng);
  await SecureStore.setItemAsync(LANG_KEY, lng);
}

export default i18n;
