import raw from '@/data/words.json';

export type Band = 1 | 2 | 3;

export type Word = {
  id: number;
  band: Band;
  word: string;
  meaning: string;
  example: string;
  // 예문의 한글 뜻
  exampleKo: string;
};

export const WORDS = raw as Word[];

export const WORD_BY_ID = new Map(WORDS.map((w) => [w.id, w]));

export const BANDS: { band: Band; name: string }[] = [
  { band: 1, name: '기초' },
  { band: 2, name: '초급' },
  { band: 3, name: '초중급' },
];
