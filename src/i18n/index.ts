import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './types';

export {
  createTranslator,
  getDateLocale,
  getDictionary,
  translateStatus,
  type Translator,
} from './translator';

export function isLocale(value: string): value is Locale {
  return value === 'fr' || value === 'en';
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}
