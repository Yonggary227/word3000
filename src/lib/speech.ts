import * as Speech from 'expo-speech';

export type Voice = { id: string; name: string; language: string };

// 휴대폰에 설치된 영어 목소리 목록. 웹에서는 목록이 늦게 채워지거나 아예 안 올 수 있어 3초까지만 기다린다.
export async function getEnglishVoices(): Promise<Voice[]> {
  const voices = await Promise.race([
    Speech.getAvailableVoicesAsync(),
    new Promise<Speech.Voice[]>((resolve) => setTimeout(() => resolve([]), 3000)),
  ]);
  const quality = (name: string) => (/premium|고음질/i.test(name) ? 0 : /enhanced|향상/i.test(name) ? 1 : 2);
  return voices
    .filter((v) => v.language.toLowerCase().startsWith('en'))
    .map((v) => ({ id: v.identifier, name: v.name, language: v.language }))
    .sort((a, b) => quality(a.name) - quality(b.name) || a.name.localeCompare(b.name));
}

let available: Set<string> | null = null;

export async function speak(text: string, voiceId: string | null) {
  Speech.stop();
  // 고른 목소리가 이 기기에 없으면(지웠거나 다른 기기) 기본 목소리로 읽는다
  if (voiceId && !available) available = new Set((await getEnglishVoices()).map((v) => v.id));
  const voice = voiceId && available?.has(voiceId) ? voiceId : undefined;
  Speech.speak(text, { language: 'en-US', rate: 0.9, voice });
}
