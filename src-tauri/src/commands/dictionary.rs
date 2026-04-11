use std::sync::Mutex;
use spellbook::Dictionary;
use std::path::PathBuf;
use tauri::State;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs::{OpenOptions, read_to_string};
use std::io::Write;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpellError {
    pub word: String,
    pub start: usize,
    pub end: usize,
    pub suggestions: Vec<String>,
}

pub struct DictionaryState {
    pub engine: Mutex<Option<Dictionary>>,
    pub personal_dict_path: Mutex<Option<PathBuf>>,
    pub synonyms: Mutex<HashMap<String, Vec<String>>>,
}

impl DictionaryState {
    pub fn new() -> Self {
        Self {
            engine: Mutex::new(None),
            personal_dict_path: Mutex::new(None),
            synonyms: Mutex::new(HashMap::new()),
        }
    }

    pub fn init(&self, aff_path: PathBuf, dic_path: PathBuf, personal_path: PathBuf, th_path: PathBuf) {
        let aff_content = read_to_string(&aff_path).unwrap_or_default();
        let dic_content = read_to_string(&dic_path).unwrap_or_default();
        
        match Dictionary::new(&aff_content, &dic_content) {
            Ok(mut dict) => {
                if let Ok(content) = read_to_string(&personal_path) {
                    for line in content.lines() {
                        let word = line.trim();
                        if !word.is_empty() {
                            let _ = dict.add(word);
                        }
                    }
                }
                let mut engine_lock = self.engine.lock().unwrap();
                *engine_lock = Some(dict);
            }
            Err(e) => eprintln!("Erro ao inicializar Spellbook: {:?}", e),
        }
        
        if let Ok(th_content) = read_to_string(&th_path) {
            let mut synonyms_map = HashMap::new();
            let mut lines = th_content.lines();
            lines.next(); // skip encoding

            while let Some(line) = lines.next() {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 2 {
                    let word = parts[0].to_lowercase();
                    if let Ok(count) = parts[1].parse::<usize>() {
                        let mut word_synonyms = Vec::new();
                        for _ in 0..count {
                            if let Some(syn_line) = lines.next() {
                                let syn_parts: Vec<&str> = syn_line.split('|').collect();
                                for s in syn_parts.iter().skip(1) {
                                    let s_clean = s.trim().to_string();
                                    if !s_clean.is_empty() && !word_synonyms.contains(&s_clean) {
                                        word_synonyms.push(s_clean);
                                    }
                                }
                            }
                        }
                        if !word_synonyms.is_empty() {
                            synonyms_map.insert(word, word_synonyms);
                        }
                    }
                }
            }
            let mut syn_lock = self.synonyms.lock().unwrap();
            *syn_lock = synonyms_map;
        }

        let mut path_lock = self.personal_dict_path.lock().unwrap();
        *path_lock = Some(personal_path);
    }
}

#[tauri::command]
pub async fn check_spelling(
    text: String,
    state: State<'_, DictionaryState>,
) -> Result<Vec<SpellError>, String> {
    let lock = state.engine.lock().unwrap();
    let mut errors = Vec::new();
    
    if let Some(engine) = &*lock {
        let mut start_idx = None;
        for (i, c) in text.char_indices() {
            if c.is_alphabetic() {
                if start_idx.is_none() {
                    start_idx = Some(i);
                }
            } else if let Some(start) = start_idx {
                let word = &text[start..i];
                if !engine.check(word) {
                    let mut suggestions = Vec::new();
                    engine.suggest(word, &mut suggestions);
                    errors.push(SpellError {
                        word: word.to_string(),
                        start,
                        end: i,
                        suggestions: suggestions.into_iter().take(5).collect(),
                    });
                }
                start_idx = None;
            }
        }
        // Check last word if it exists
        if let Some(start) = start_idx {
            let word = &text[start..];
            if !engine.check(word) {
                let mut suggestions = Vec::new();
                engine.suggest(word, &mut suggestions);
                errors.push(SpellError {
                    word: word.to_string(),
                    start,
                    end: text.len(),
                    suggestions: suggestions.into_iter().take(5).collect(),
                });
            }
        }
    }
    
    Ok(errors)
}

#[tauri::command]
pub async fn get_synonyms(
    word: String,
    state: State<'_, DictionaryState>,
) -> Result<Vec<String>, String> {
    let syn_lock = state.synonyms.lock().unwrap();
    Ok(syn_lock.get(&word.to_lowercase())
        .cloned()
        .unwrap_or_default())
}

#[tauri::command]
pub async fn add_to_dictionary(
    word: String,
    state: State<'_, DictionaryState>,
) -> Result<bool, String> {
    let mut lock = state.engine.lock().unwrap();
    if let Some(engine) = &mut *lock {
        if engine.add(&word).is_ok() {
            let path_lock = state.personal_dict_path.lock().unwrap();
            if let Some(path) = &*path_lock {
                if let Some(parent) = path.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
                    let _ = writeln!(file, "{}", word);
                    return Ok(true);
                }
            }
        }
    }
    Ok(false)
}
