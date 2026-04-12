import { invoke } from '@tauri-apps/api/core';

export interface SpellError {
  word: string;
  start: number;
  end: number;
}

export async function checkSpelling(text: string): Promise<SpellError[]> {
  return invoke('check_spelling', { text });
}

export async function checkSpellingBatch(texts: string[]): Promise<SpellError[][]> {
  return invoke('check_spelling_batch', { texts });
}

export async function getSpellSuggestions(word: string): Promise<string[]> {
  return invoke('get_spell_suggestions', { word });
}

export async function getSynonyms(word: string): Promise<string[]> {
  return invoke('get_synonyms', { word });
}

export async function addToDictionary(word: string): Promise<boolean> {
  return invoke('add_to_dictionary', { word });
}
