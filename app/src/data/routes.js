export const CATEGORIES = {
  nature: { label: 'טבע', icon: '🌿', color: '#2E6B4F' },
  cafe: { label: 'קפה', icon: '☕', color: '#8A6A3C' },
  food: { label: 'אוכל', icon: '🍽️', color: '#A4503C' },
  view: { label: 'נוף', icon: '🏞️', color: '#3C6A8A' },
};

export function getCategory(cat) {
  return CATEGORIES[cat] || CATEGORIES.nature;
}

export const COLLECTIONS = [
  { id: 'all', label: 'הכול' },
  { id: 'day', label: 'טיולי יום' },
  { id: 'kids', label: 'עם ילדים' },
  { id: 'water', label: 'ליד המים' },
  { id: 'rain', label: 'יום גשום' },
];

export const AREAS = [
  'גליל עליון', 'גליל תחתון', 'גולן', 'עמקים', 'כרמל וחיפה', 'בקעת הירדן', 'שרון', 'מרכז',
  'שפלה', 'ירושלים', 'ים המלח', 'מדבר יהודה', 'נגב', 'ערבה', 'אילת',
];

export const DIFFICULTY_LEVELS = ['קל', 'בינוני', 'קשה'];
