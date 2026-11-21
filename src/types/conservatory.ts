export type FlowerPaletteId =
  | 'blush-peony'
  | 'golden-sun'
  | 'lavender-dusk'
  | 'velvet-rose';

export type WoodFinishId = 'oiled-walnut' | 'warm-maple' | 'ebonized-ash';

export type LightingMoodId = 'golden-hour' | 'night';

export type CameraPresetId = 'overview' | 'turntable' | 'bouquet' | 'portrait';

export type TabletopItemId = 'teacup' | 'lantern' | 'journal' | 'balloon' | 'petals';

export interface FlowerPalette {
  id: FlowerPaletteId;
  label: string;
  primary: string;
  secondary: string;
  center: string;
  swatch: string;
}

export interface WoodFinish {
  id: WoodFinishId;
  label: string;
  baseHex: string;
  grainHex: string;
  roughness: number;
}

export interface LightingMood {
  id: LightingMoodId;
  label: string;
  skyHex: string;
  fogDensity: number;
  keyColor: string;
  keyIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  rimColor: string;
  rimIntensity: number;
  softboxColor: string;
  softboxIntensity: number;
  envIntensity: number;
  exposure: number;
  candleIntensity: number;
  moonGlow: number;
  moonHaloOpacity: number;
  isDark: boolean;
}

export interface CustomMp3Track {
  title: string;
  audioUrl: string;
  sourceType: 'file' | 'url';
}

export interface GiftConfig {
  recipientName: string;
  senderName: string;
  noteTitle: string;
  noteBody: string;
  songDedication: string;
  flowerPalette: FlowerPaletteId;
  woodFinish: WoodFinishId;
  lightingMood: LightingMoodId;
  snowEnabled: boolean;
  coverImageUrl: string;
}

export const DEFAULT_COVER_ART =
  '/src/assets/images/curly_vinyl_flowers_cover_1795256610785.jpg';

export const DEFAULT_KEEPSAKE_PHOTO =
  '/src/assets/images/botanical_note_card_1795256609298.jpg';

export const FLOWER_PALETTES: Record<FlowerPaletteId, FlowerPalette> = {
  'blush-peony': {
    id: 'blush-peony',
    label: 'Blush Peony',
    primary: '#E8A5AE',
    secondary: '#F5D5D8',
    center: '#E6B84C',
    swatch: '#D98794',
  },
  'golden-sun': {
    id: 'golden-sun',
    label: 'Sunlit Chamomile',
    primary: '#F0BD59',
    secondary: '#FBE3A4',
    center: '#8A5226',
    swatch: '#E0A33A',
  },
  'lavender-dusk': {
    id: 'lavender-dusk',
    label: 'Lavender Dusk',
    primary: '#B39CD0',
    secondary: '#DDD2EC',
    center: '#E5C67A',
    swatch: '#9B82BD',
  },
  'velvet-rose': {
    id: 'velvet-rose',
    label: 'Velvet Rose',
    primary: '#A83F52',
    secondary: '#D47282',
    center: '#E8C56E',
    swatch: '#9E384B',
  },
};

export const WOOD_FINISHES: Record<WoodFinishId, WoodFinish> = {
  'oiled-walnut': {
    id: 'oiled-walnut',
    label: 'Oiled Walnut',
    baseHex: '#5A3B28',
    grainHex: '#3A2316',
    roughness: 0.56,
  },
  'warm-maple': {
    id: 'warm-maple',
    label: 'Warm Maple',
    baseHex: '#BA8B5C',
    grainHex: '#93673D',
    roughness: 0.48,
  },
  'ebonized-ash': {
    id: 'ebonized-ash',
    label: 'Ebonized Ash',
    baseHex: '#282422',
    grainHex: '#181514',
    roughness: 0.52,
  },
};

export const LIGHTING_MOODS: Record<LightingMoodId, LightingMood> = {
  'golden-hour': {
    id: 'golden-hour',
    label: 'Golden Hour',
    skyHex: '#E8D5BE',
    fogDensity: 0.052,
    keyColor: '#FFC98B',
    keyIntensity: 2.75,
    hemiSky: '#C7D3E3',
    hemiGround: '#7D5C43',
    hemiIntensity: 0.9,
    rimColor: '#FFE0B5',
    rimIntensity: 0.92,
    softboxColor: '#FFF4E2',
    softboxIntensity: 2.2,
    envIntensity: 1.0,
    exposure: 1.08,
    candleIntensity: 0.65,
    moonGlow: 0.26,
    moonHaloOpacity: 0.62,
    isDark: false,
  },
  night: {
    id: 'night',
    label: 'Night',
    skyHex: '#151722',
    fogDensity: 0.056,
    keyColor: '#B8C9EC',
    keyIntensity: 1.65,
    hemiSky: '#3E4B6E',
    hemiGround: '#241D19',
    hemiIntensity: 0.68,
    rimColor: '#9AB0DF',
    rimIntensity: 0.62,
    softboxColor: '#9BAED9',
    softboxIntensity: 0.55,
    envIntensity: 0.52,
    exposure: 0.96,
    candleIntensity: 1.55,
    moonGlow: 0.48,
    moonHaloOpacity: 0.95,
    isDark: true,
  },
};

export const DEFAULT_GIFT_CONFIG: GiftConfig = {
  recipientName: 'for my priority',
  senderName: 'Someone who likes talking to you',
  noteTitle: 'For my priority — Music & Flowers',
  noteBody:
    'I wanted to make a quiet little corner online that felt like you—a record spinning softly, fresh blooms on the table, and a gentle balloon floating by. Tap the record to play the music, or click the flowers whenever you feel like changing their color.',
  songDedication: 'Our Song (MP3)',
  flowerPalette: 'blush-peony',
  woodFinish: 'oiled-walnut',
  lightingMood: 'golden-hour',
  snowEnabled: false,
  coverImageUrl: DEFAULT_COVER_ART,
};
