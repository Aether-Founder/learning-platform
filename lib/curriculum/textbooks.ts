export type TextbookLevel = 'vmbo' | 'havo' | 'vwo';

export interface Chapter {
  id: string;
  title: string;
  topics: string[];
}

export interface Textbook {
  id: string;
  title: string;
  publisher: string;
  edition: string;
  isbn: string;
  subject: string;
  level: TextbookLevel[];
  chapters: Chapter[];
}

export const DUTCH_TEXTBOOKS: Textbook[] = [
  {
    id: 'getal-en-ruimte-11',
    title: 'Getal & Ruimte',
    publisher: 'Noordhoff',
    edition: '11e editie',
    isbn: '9789001878112',
    subject: 'Wiskunde',
    level: ['vmbo', 'havo', 'vwo'],
    chapters: [
      { id: 'g-r-1', title: 'Rekenen en algebra', topics: ['machten', 'wortels', 'breuken'] },
      {
        id: 'g-r-2',
        title: 'Functies en grafieken',
        topics: ['lineaire functies', 'exponentiële groei'],
      },
      { id: 'g-r-3', title: 'Meetkunde', topics: ['hoeken', 'driehoeken', 'oppervlakte'] },
    ],
  },
  {
    id: 'nectar-biologie',
    title: 'Nectar',
    publisher: 'Malmberg',
    edition: '6e editie',
    isbn: '9789034598916',
    subject: 'Biologie',
    level: ['vmbo', 'havo', 'vwo'],
    chapters: [
      { id: 'nectar-1', title: 'Cellen en weefsels', topics: ['celorganellen', 'microscopie'] },
      { id: 'nectar-2', title: 'Voeding en vertering', topics: ['enzymen', 'darmstelsel'] },
      { id: 'nectar-3', title: 'Erfelijkheid', topics: ['DNA', 'genen', 'kruisingen'] },
    ],
  },
  {
    id: 'nova-scheikunde',
    title: 'Nova',
    publisher: 'Malmberg',
    edition: '6e editie',
    isbn: '9789034597360',
    subject: 'Scheikunde',
    level: ['vmbo', 'havo', 'vwo'],
    chapters: [
      { id: 'nova-1', title: 'Stoffen en deeltjes', topics: ['moleculen', 'eigenschappen'] },
      { id: 'nova-2', title: 'Reacties', topics: ['reactievergelijkingen', 'energie'] },
      { id: 'nova-3', title: 'Zuren en basen', topics: ['pH', 'indicatoren', 'neutralisatie'] },
    ],
  },
  {
    id: 'stepping-stones-english',
    title: 'Stepping Stones',
    publisher: 'Noordhoff',
    edition: '6e editie',
    isbn: '9789001869967',
    subject: 'Engels',
    level: ['vmbo', 'havo', 'vwo'],
    chapters: [
      {
        id: 'stones-1',
        title: 'People and places',
        topics: ['describing people', 'present tenses'],
      },
      { id: 'stones-2', title: 'Stories', topics: ['past tenses', 'narrative writing'] },
      { id: 'stones-3', title: 'The world around us', topics: ['opinion', 'conditionals'] },
    ],
  },
  {
    id: 'grandes-lignes-frans',
    title: 'Grandes Lignes',
    publisher: 'Malmberg',
    edition: '6e editie',
    isbn: '9789034589747',
    subject: 'Frans',
    level: ['vmbo', 'havo', 'vwo'],
    chapters: [
      { id: 'gl-1', title: 'Se présenter', topics: ['être', 'avoir', 'persoonlijke gegevens'] },
      { id: 'gl-2', title: 'La vie quotidienne', topics: ['regelmatige werkwoorden', 'tijd'] },
      { id: 'gl-3', title: 'Voyager', topics: ['de weg vragen', 'futur proche'] },
    ],
  },
  {
    id: 'geschichte-und-geschehen',
    title: 'Geschichte und Geschehen',
    publisher: 'Klett',
    edition: '5e editie',
    isbn: '9783124434108',
    subject: 'Geschiedenis',
    level: ['vmbo', 'havo', 'vwo'],
    chapters: [
      { id: 'gug-1', title: 'De oudheid', topics: ['Griekenland', 'Rome'] },
      { id: 'gug-2', title: 'De middeleeuwen', topics: ['standenmaatschappij', 'steden'] },
      { id: 'gug-3', title: 'De moderne tijd', topics: ['industrialisatie', 'democratie'] },
    ],
  },
];

export function getTextbookChapters(textbookId: string): Chapter[] {
  return DUTCH_TEXTBOOKS.find((textbook) => textbook.id === textbookId)?.chapters ?? [];
}
