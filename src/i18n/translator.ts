import { en } from './dictionaries/en';
import { fr, type Dictionary } from './dictionaries/fr';
import type { Locale } from './types';

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

type InterpolationVars = Record<string, string | number>;

function interpolate(template: string, vars?: InterpolationVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}

function resolve(obj: Dictionary, path: string): string | undefined {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj) as string | undefined;
}

export function createTranslator(locale: Locale) {
  const dictionary = getDictionary(locale);

  return function t(path: string, vars?: InterpolationVars): string {
    const value = resolve(dictionary, path);
    if (typeof value !== 'string') return path;
    return interpolate(value, vars);
  };
}

export type Translator = ReturnType<typeof createTranslator>;

export function getDateLocale(locale: Locale): string {
  return locale === 'fr' ? 'fr-FR' : 'en-US';
}

export function translateStatus(t: Translator, status: string): string {
  const key = `status.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}
