import type { Language } from './i18n-config';

const DUTCH_TIMEZONES: readonly string[] = ['Europe/Amsterdam', 'Europe/Brussels'];
const DUTCH_REGIONS: readonly string[] = ['NL', 'BE'];

const RUSSIAN_TIMEZONES: readonly string[] = [
  'Europe/Moscow',
  'Europe/Kaliningrad',
  'Europe/Samara',
  'Europe/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
];
const RUSSIAN_REGIONS: readonly string[] = ['RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ'];

const CHINESE_TIMEZONES: readonly string[] = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei'];
const CHINESE_REGIONS: readonly string[] = ['CN', 'HK', 'TW', 'SG', 'MO'];

const FRENCH_TIMEZONES: readonly string[] = [
  'Europe/Paris',
  'Europe/Monaco',
  'Africa/Algiers',
  'Africa/Tunis',
  'Africa/Casablanca',
  'Indian/Reunion',
  'Pacific/Noumea',
];
const FRENCH_REGIONS: readonly string[] = ['FR', 'MC', 'DZ', 'TN', 'MA', 'RE', 'NC'];

const SPANISH_TIMEZONES: readonly string[] = [
  'Europe/Madrid',
  'Atlantic/Canary',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Buenos_Aires',
  'America/Santiago',
];
const SPANISH_REGIONS: readonly string[] = ['ES', 'MX', 'CO', 'PE', 'AR', 'CL', 'VE'];

const ARABIC_TIMEZONES: readonly string[] = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Qatar',
  'Asia/Bahrain',
  'Africa/Cairo',
  'Africa/Tripoli',
  'Asia/Baghdad',
  'Asia/Amman',
];
const ARABIC_REGIONS: readonly string[] = [
  'SA',
  'AE',
  'KW',
  'QA',
  'BH',
  'EG',
  'LY',
  'IQ',
  'JO',
  'MA',
  'DZ',
  'TN',
];

const GERMAN_TIMEZONES: readonly string[] = [
  'Europe/Berlin',
  'Europe/Vienna',
  'Europe/Zurich',
  'Europe/Brussels',
];
const GERMAN_REGIONS: readonly string[] = ['DE', 'AT', 'CH', 'LI'];

const JAPANESE_TIMEZONES: readonly string[] = ['Asia/Tokyo'];
const JAPANESE_REGIONS: readonly string[] = ['JP'];

const KOREAN_TIMEZONES: readonly string[] = ['Asia/Seoul'];
const KOREAN_REGIONS: readonly string[] = ['KR'];

const HINDI_TIMEZONES: readonly string[] = ['Asia/Kolkata', 'Asia/Dhaka'];
const HINDI_REGIONS: readonly string[] = ['IN', 'BD', 'NP', 'LK'];

const PORTUGUESE_TIMEZONES: readonly string[] = [
  'Europe/Lisbon',
  'America/Sao_Paulo',
  'America/Lisbon',
];
const PORTUGUESE_REGIONS: readonly string[] = ['PT', 'BR'];

const ITALIAN_TIMEZONES: readonly string[] = ['Europe/Rome', 'Europe/Vatican'];
const ITALIAN_REGIONS: readonly string[] = ['IT', 'VA', 'SM'];

const TURKISH_TIMEZONES: readonly string[] = ['Europe/Istanbul', 'Asia/Istanbul'];
const TURKISH_REGIONS: readonly string[] = ['TR', 'CY'];

const INDONESIAN_TIMEZONES: readonly string[] = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];
const INDONESIAN_REGIONS: readonly string[] = ['ID'];

const VIETNAMESE_TIMEZONES: readonly string[] = ['Asia/Ho_Chi_Minh'];
const VIETNAMESE_REGIONS: readonly string[] = ['VN'];

const THAI_TIMEZONES: readonly string[] = ['Asia/Bangkok'];
const THAI_REGIONS: readonly string[] = ['TH'];

const POLISH_TIMEZONES: readonly string[] = ['Europe/Warsaw'];
const POLISH_REGIONS: readonly string[] = ['PL'];

const UKRAINIAN_TIMEZONES: readonly string[] = ['Europe/Kiev', 'Europe/Simferopol'];
const UKRAINIAN_REGIONS: readonly string[] = ['UA'];

/**
 * Detect the visitor's country from browser signals and map it to a language.
 * Priority: German > Japanese > Korean > Hindi > Portuguese > Italian > Turkish > Indonesian > Vietnamese > Thai > Polish > Ukrainian > Russian > Chinese > French > Spanish > Arabic > Dutch > English
 */
export function detectLanguageFromLocation(): Language {
  try {
    if (typeof window === 'undefined') {
      return 'en';
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Check German
    if (timeZone && GERMAN_TIMEZONES.includes(timeZone)) {
      return 'de';
    }

    // Check Japanese
    if (timeZone && JAPANESE_TIMEZONES.includes(timeZone)) {
      return 'ja';
    }

    // Check Korean
    if (timeZone && KOREAN_TIMEZONES.includes(timeZone)) {
      return 'ko';
    }

    // Check Hindi
    if (timeZone && HINDI_TIMEZONES.includes(timeZone)) {
      return 'hi';
    }

    // Check Portuguese
    if (timeZone && PORTUGUESE_TIMEZONES.includes(timeZone)) {
      return 'pt';
    }

    // Check Italian
    if (timeZone && ITALIAN_TIMEZONES.includes(timeZone)) {
      return 'it';
    }

    // Check Turkish
    if (timeZone && TURKISH_TIMEZONES.includes(timeZone)) {
      return 'tr';
    }

    // Check Indonesian
    if (timeZone && INDONESIAN_TIMEZONES.includes(timeZone)) {
      return 'id';
    }

    // Check Vietnamese
    if (timeZone && VIETNAMESE_TIMEZONES.includes(timeZone)) {
      return 'vi';
    }

    // Check Thai
    if (timeZone && THAI_TIMEZONES.includes(timeZone)) {
      return 'th';
    }

    // Check Polish
    if (timeZone && POLISH_TIMEZONES.includes(timeZone)) {
      return 'pl';
    }

    // Check Ukrainian
    if (timeZone && UKRAINIAN_TIMEZONES.includes(timeZone)) {
      return 'uk';
    }

    // Check Russian
    if (timeZone && RUSSIAN_TIMEZONES.includes(timeZone)) {
      return 'ru';
    }

    // Check Chinese
    if (timeZone && CHINESE_TIMEZONES.includes(timeZone)) {
      return 'zh';
    }

    // Check French
    if (timeZone && FRENCH_TIMEZONES.includes(timeZone)) {
      return 'fr';
    }

    // Check Spanish
    if (timeZone && SPANISH_TIMEZONES.includes(timeZone)) {
      return 'es';
    }

    // Check Arabic
    if (timeZone && ARABIC_TIMEZONES.includes(timeZone)) {
      return 'ar';
    }

    // Check Dutch
    if (timeZone && DUTCH_TIMEZONES.includes(timeZone)) {
      return 'nl';
    }

    // Check browser language regions
    const regions = navigator.languages?.length
      ? new Set(
          navigator.languages.map((locale) => locale.split('-')[1]?.toUpperCase()).filter(Boolean)
        )
      : new Set<string>();

    if (GERMAN_REGIONS.some((region) => regions.has(region))) {
      return 'de';
    }
    if (JAPANESE_REGIONS.some((region) => regions.has(region))) {
      return 'ja';
    }
    if (KOREAN_REGIONS.some((region) => regions.has(region))) {
      return 'ko';
    }
    if (HINDI_REGIONS.some((region) => regions.has(region))) {
      return 'hi';
    }
    if (PORTUGUESE_REGIONS.some((region) => regions.has(region))) {
      return 'pt';
    }
    if (ITALIAN_REGIONS.some((region) => regions.has(region))) {
      return 'it';
    }
    if (TURKISH_REGIONS.some((region) => regions.has(region))) {
      return 'tr';
    }
    if (INDONESIAN_REGIONS.some((region) => regions.has(region))) {
      return 'id';
    }
    if (VIETNAMESE_REGIONS.some((region) => regions.has(region))) {
      return 'vi';
    }
    if (THAI_REGIONS.some((region) => regions.has(region))) {
      return 'th';
    }
    if (POLISH_REGIONS.some((region) => regions.has(region))) {
      return 'pl';
    }
    if (UKRAINIAN_REGIONS.some((region) => regions.has(region))) {
      return 'uk';
    }
    if (RUSSIAN_REGIONS.some((region) => regions.has(region))) {
      return 'ru';
    }
    if (CHINESE_REGIONS.some((region) => regions.has(region))) {
      return 'zh';
    }
    if (FRENCH_REGIONS.some((region) => regions.has(region))) {
      return 'fr';
    }
    if (SPANISH_REGIONS.some((region) => regions.has(region))) {
      return 'es';
    }
    if (ARABIC_REGIONS.some((region) => regions.has(region))) {
      return 'ar';
    }
    if (DUTCH_REGIONS.some((region) => regions.has(region))) {
      return 'nl';
    }

    // Check browser language codes directly
    for (const lang of navigator.languages || []) {
      const code = lang.split('-')[0].toLowerCase();
      if (
        [
          'de',
          'ja',
          'ko',
          'hi',
          'pt',
          'it',
          'tr',
          'id',
          'vi',
          'th',
          'pl',
          'uk',
          'ru',
          'zh',
          'fr',
          'es',
          'ar',
          'nl',
        ].includes(code)
      ) {
        return code as Language;
      }
    }

    return 'en';
  } catch {
    return 'en';
  }
}
