use std::sync::{Arc, Mutex, RwLock};
use spellbook::Dictionary;
use std::path::PathBuf;
use tauri::State;
use serde::{Serialize, Deserialize};
use std::collections::{HashMap, HashSet};
use std::fs::{OpenOptions, read_to_string};
use std::io::Write;
use tauri::async_runtime::spawn_blocking;
use tokio::time::{timeout, Duration};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpellError {
    pub word: String,
    pub start: usize,
    pub end: usize,
}

pub struct DictionaryState {
    pub engine: Arc<RwLock<Option<Dictionary>>>,
    pub personal_dict_path: Arc<Mutex<Option<PathBuf>>>,
    pub synonyms: Arc<Mutex<HashMap<String, Vec<String>>>>,
}

impl DictionaryState {
    pub fn new() -> Self {
        Self {
            engine: Arc::new(RwLock::new(None)),
            personal_dict_path: Arc::new(Mutex::new(None)),
            synonyms: Arc::new(Mutex::new(HashMap::new())),
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
                let mut engine_lock = self.engine.write().unwrap();
                *engine_lock = Some(dict);
            }
            Err(e) => eprintln!("Erro ao inicializar Spellbook: {:?}", e),
        }

        if let Ok(th_content) = read_to_string(&th_path) {
            let mut synonyms_map = HashMap::new();
            let mut lines = th_content.lines();
            lines.next();

            while let Some(line) = lines.next() {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 2 {
                    let word = parts[0].to_lowercase();
                    if let Ok(count) = parts[1].parse::<usize>() {
                        let mut groups = Vec::new();
                        for _ in 0..count {
                            if let Some(syn_line) = lines.next() {
                                let syn_parts: Vec<&str> = syn_line.split('|').collect();
                                let mut group = Vec::new();

                                for s in syn_parts.iter().skip(1) {
                                    let s_clean = s.trim().to_string();

                                    if !s_clean.is_empty() && s_clean.to_lowercase() != word && !group.contains(&s_clean) {
                                        group.push(s_clean);
                                    }
                                }
                                if !group.is_empty() {
                                    groups.push(group);
                                }
                            }
                        }

                        let mut word_synonyms = Vec::new();
                        let mut i = 0;
                        let mut added = true;
                        while added {
                            added = false;
                            for group in &groups {
                                if i < group.len() {
                                    let s = &group[i];
                                    if !word_synonyms.contains(s) {
                                        word_synonyms.push(s.clone());
                                    }
                                    added = true;
                                }
                            }
                            i += 1;
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

fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    let v1: Vec<char> = s1.chars().collect();
    let v2: Vec<char> = s2.chars().collect();
    let n = v1.len();
    let m = v2.len();
    let mut dp = vec![vec![0; m + 1]; n + 1];

    #[allow(clippy::needless_range_loop)]
    for i in 0..=n { dp[i][0] = i; }
    #[allow(clippy::needless_range_loop)]
    for j in 0..=m { dp[0][j] = j; }

    for i in 1..=n {
        for j in 1..=m {
            let cost = if v1[i - 1] == v2[j - 1] { 0 } else { 1 };
            dp[i][j] = (dp[i - 1][j] + 1)
                .min(dp[i][j - 1] + 1)
                .min(dp[i - 1][j - 1] + cost);
        }
    }
    dp[n][m]
}

fn generate_edits_1(word: &str) -> Vec<String> {
    let mut edits = Vec::new();
    let chars: Vec<char> = word.chars().collect();
    let n = chars.len();

    for i in 0..n {
        let mut s = String::new();
        for (j, &c) in chars.iter().enumerate() {
            if i != j { s.push(c); }
        }
        edits.push(s);
    }

    for i in 0..n - 1 {
        let mut s = String::new();
        for j in 0..n {
            if j == i { s.push(chars[i+1]); }
            else if j == i + 1 { s.push(chars[i]); }
            else { s.push(chars[j]); }
        }
        edits.push(s);
    }

    let alphabet = "abcdefghijklmnopqrstuvwxyzáàãâéêíóõôúüç";

    for i in 0..n {
        for c in alphabet.chars() {
            let mut s = String::new();
            for (j, &old_c) in chars.iter().enumerate() {
                if i == j { s.push(c); }
                else { s.push(old_c); }
            }
            edits.push(s);
        }
    }

    for i in 0..=n {
        for c in alphabet.chars() {
            let mut s = String::new();
            #[allow(clippy::needless_range_loop)]
            for j in 0..n {
                if i == j { s.push(c); }
                s.push(chars[j]);
            }
            if i == n { s.push(c); }
            edits.push(s);
        }
    }

    edits
}

fn generate_lemma_fallbacks(word: &str) -> Vec<String> {
    let mut fallbacks = Vec::new();

    if let Some(stripped) = word.strip_suffix("mente") {
        fallbacks.push(stripped.to_string());
    }

    if word.ends_with("ões") || word.ends_with("ães") {
        if let Some(stripped) = word.get(..word.len() - 3) {
            fallbacks.push(format!("{}ão", stripped));
        }
    }

    if let Some(stripped) = word.strip_suffix("is") {
        fallbacks.push(format!("{}l", stripped));
    }

    if let Some(stripped) = word.strip_suffix("es") {
        fallbacks.push(stripped.to_string());
    } else if let Some(stripped) = word.strip_suffix('s') {
        fallbacks.push(stripped.to_string());
    }

    if let Some(stripped) = word.strip_suffix('a') {
        fallbacks.push(format!("{}o", stripped));
    }

    fallbacks
}

fn apply_phonetic_rules(word: &str) -> Vec<String> {
    let mut variants = Vec::new();
    let rules = [
        ("x", "ch"), ("ch", "x"),
        ("s", "z"), ("z", "s"),
        ("ss", "ç"), ("ç", "ss"),
        ("c", "q"), ("q", "c"),
        ("g", "j"), ("j", "g"),
        ("i", "e"), ("e", "i"),
        ("o", "u"), ("u", "o"),
    ];

    for (from, to) in rules {
        if word.contains(from) {
            variants.push(word.replace(from, to));
        }
    }
    variants
}

fn process_word(text: &str, start: usize, mut end: usize, engine: &Dictionary, errors: &mut Vec<SpellError>) {
    let mut word = &text[start..end];

    while (word.ends_with('-') || word.ends_with('\'')) && end > start {
        end -= 1;
        word = &text[start..end];
    }

    if !word.is_empty() && !engine.check(word) {
        errors.push(SpellError {
            word: word.to_string(),
            start,
            end,
        });
    }
}

#[tauri::command]
pub async fn check_spelling(
    text: String,
    state: State<'_, DictionaryState>,
) -> Result<Vec<SpellError>, String> {
    let engine_arc = Arc::clone(&state.engine);

    spawn_blocking(move || {
        let lock = engine_arc.read().unwrap();
        let mut errors = Vec::new();

        if let Some(engine) = &*lock {
            let mut start_idx = None;
            for (i, c) in text.char_indices() {
                // Aceita caracteres alfabéticos, hífens e apóstrofos como partes de uma palavra
                let is_word_char = c.is_alphabetic() || c == '-' || c == '\'';

                if is_word_char {
                    if start_idx.is_none()

                        && c.is_alphabetic() {
                            start_idx = Some(i);
                        }
                } else if let Some(start) = start_idx {
                    process_word(&text, start, i, engine, &mut errors);
                    start_idx = None;
                }
            }

            if let Some(start) = start_idx {
                process_word(&text, start, text.len(), engine, &mut errors);
            }
        }
        Ok(errors)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn check_spelling_batch(
    texts: Vec<String>,
    state: State<'_, DictionaryState>,
) -> Result<Vec<Vec<SpellError>>, String> {
    let engine_arc = Arc::clone(&state.engine);

    spawn_blocking(move || {
        let lock = engine_arc.read().unwrap();
        let mut results = Vec::with_capacity(texts.len());

        if let Some(engine) = &*lock {
            for text in texts {
                let mut errors = Vec::new();
                let mut start_idx = None;
                for (i, c) in text.char_indices() {
                    let is_word_char = c.is_alphabetic() || c == '-' || c == '\'';
                    if is_word_char {
                        if start_idx.is_none() && c.is_alphabetic() {
                            start_idx = Some(i);
                        }
                    } else if let Some(start) = start_idx {
                        process_word(&text, start, i, engine, &mut errors);
                        start_idx = None;
                    }
                }
                if let Some(start) = start_idx {
                    process_word(&text, start, text.len(), engine, &mut errors);
                }
                results.push(errors);
            }
        } else {
            for _ in 0..texts.len() {
                results.push(Vec::new());
            }
        }
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_spell_suggestions(
    word: String,
    state: State<'_, DictionaryState>,
) -> Result<Vec<String>, String> {
    let engine_arc = Arc::clone(&state.engine);
    let word_clone = word.clone();

    // 1. Run our custom heuristic first (Sync in spawn_blocking)
    let heuristic_results = spawn_blocking(move || -> Vec<String> {
        let lock = engine_arc.read().unwrap();
        let engine = match &*lock {
            Some(e) => e,
            None => return Vec::new(),
        };

        let mut candidates = HashSet::new();

        // Level 1: Edit Distance 1
        let e1 = generate_edits_1(&word_clone);
        for cand in &e1 {
            if engine.check(cand) {
                candidates.insert(cand.clone());
            }
        }

        // Level 2: Phonetic Rules
        for cand in apply_phonetic_rules(&word_clone) {
            if engine.check(&cand) {
                candidates.insert(cand);
            }
        }

        // Level 3: Targeted Edit Distance 2 (Deletions only for speed)
        // This catches "axabacate" -> "abacate"
        if candidates.is_empty() {
            for cand1 in &e1 {
                let chars: Vec<char> = cand1.chars().collect();
                if chars.len() > 1 {
                    for i in 0..chars.len() {
                        let mut s = String::new();
                        for (j, &c) in chars.iter().enumerate() {
                            if i != j { s.push(c); }
                        }
                        if !s.is_empty() && engine.check(&s) {
                            candidates.insert(s);
                        }
                    }
                }
            }
        }

        let mut results: Vec<String> = candidates.into_iter()
            .filter(|s| s.len() > 1 && s != &word_clone)
            .collect();

        // Ranking
        results.sort_by(|a, b| {
            let dist_a = levenshtein_distance(&word_clone, a);
            let dist_b = levenshtein_distance(&word_clone, b);
            dist_a.cmp(&dist_b)
                .then_with(|| a.len().cmp(&b.len()))
        });

        results
    }).await.map_err(|e| e.to_string())?;

    // 2. Fallback to native suggest with a very short timeout (150ms)
    let engine_arc_native = Arc::clone(&state.engine);
    let word_native = word.clone();

    let native_result = timeout(
        Duration::from_millis(150),
        spawn_blocking(move || -> Vec<String> {
            let lock = engine_arc_native.read().unwrap();
            if let Some(engine) = &*lock {
                let mut suggestions = Vec::new();
                engine.suggest(&word_native, &mut suggestions);
                return suggestions;
            }
            Vec::new()
        })
    ).await;

    let mut final_suggestions = heuristic_results;
    if let Ok(Ok(native_sugs)) = native_result {
        for s in native_sugs {
            if !final_suggestions.contains(&s) && s != word {
                final_suggestions.push(s);
            }
        }
    }

    // Final Ranking & Truncation
    final_suggestions.sort_by(|a, b| {
        let dist_a = levenshtein_distance(&word, a);
        let dist_b = levenshtein_distance(&word, b);

        // Prioritize single words over spaced words
        let spaced_a = a.contains(' ');
        let spaced_b = b.contains(' ');

        spaced_a.cmp(&spaced_b)
            .then_with(|| dist_a.cmp(&dist_b))
            .then_with(|| a.len().cmp(&b.len()))
    });

    Ok(final_suggestions.into_iter().take(5).collect())
}

#[tauri::command]
pub async fn get_synonyms(
    word: String,
    state: State<'_, DictionaryState>,
) -> Result<Vec<String>, String> {
    let synonyms_arc = Arc::clone(&state.synonyms);
    let word_lower = word.to_lowercase();

    spawn_blocking(move || {
        let syn_lock = synonyms_arc.lock().unwrap();

        if let Some(syns) = syn_lock.get(&word_lower) {
            return Ok(syns.clone());
        }

        let fallbacks = generate_lemma_fallbacks(&word_lower);
        for lemma in fallbacks {
            if let Some(syns) = syn_lock.get(&lemma) {
                return Ok(syns.clone());
            }
        }

        Ok(Vec::new())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn add_to_dictionary(
    word: String,
    state: State<'_, DictionaryState>,
) -> Result<bool, String> {
    let engine_arc = Arc::clone(&state.engine);
    let path_arc = Arc::clone(&state.personal_dict_path);

    spawn_blocking(move || {

        let mut lock = engine_arc.write().unwrap();
        if let Some(engine) = &mut *lock {
            if engine.add(&word).is_ok() {
                let path_lock = path_arc.lock().unwrap();
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
    })
    .await
    .map_err(|e| e.to_string())?
}
