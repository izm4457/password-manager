mod crypto;

use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct AppConfig {
    data_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    window_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    window_height: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    window_x: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    window_y: Option<f64>,
    #[serde(default = "default_auto_lock_minutes")]
    auto_lock_minutes: u32,
}

fn default_auto_lock_minutes() -> u32 {
    5 // Default to 5 minutes
}

fn get_config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("config.json"))
}

fn get_data_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config_path = get_config_path(app)?;
    if config_path.exists() {
        let config_str = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
        let config: AppConfig = serde_json::from_str(&config_str).map_err(|e| e.to_string())?;
        Ok(PathBuf::from(config.data_path))
    } else {
        // Fallback or error if not initialized
        Err("Not initialized".to_string())
    }
}

use std::sync::Mutex;
use secrecy::Secret;

struct AppState {
    // The derived key used for encryption/decryption and its salt.
    // Kept in memory only while logged in.
    key: Mutex<Option<(Secret<Vec<u8>>, String)>>,
}

#[tauri::command]
fn login(app: tauri::AppHandle, state: tauri::State<AppState>, master_password: String) -> Result<(), String> {
    // Try to load existing data to verify password
    // If no data exists, we just derive the key and set it (first run scenario handled by initialize)
    
    let path = get_data_path(&app)?;
    
    if path.exists() {
        // Verify password by attempting to decrypt
        let encrypted = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        // We need to extract salt from encrypted data to derive the correct key
        let encrypted_data: crypto::EncryptedData = serde_json::from_str(&encrypted)
            .map_err(|e| format!("Invalid data format: {}", e))?;
            
        let (key, _) = crypto::derive_key(&master_password, Some(&encrypted_data.salt))?;
        
        // Verify by decrypting
        crypto::decrypt_with_key(&encrypted, &key)?;
        
        // If successful, store key and salt in state
        *state.key.lock().unwrap() = Some((key, encrypted_data.salt));
    } else {
        // If no data file, we can't verify against it, but we can set the key.
        // However, usually login is called after initialization.
        // If we are just starting fresh, we might not have a file yet.
        // Let's derive a new key.
        let (key, salt) = crypto::derive_key(&master_password, None)?;
        *state.key.lock().unwrap() = Some((key, salt));
    }
    
    Ok(())
}

#[tauri::command]
fn logout(state: tauri::State<AppState>) -> Result<(), String> {
    *state.key.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn save_passwords(app: tauri::AppHandle, state: tauri::State<AppState>, data: String) -> Result<(), String> {
    let path = get_data_path(&app)?;
    
    let key_guard = state.key.lock().unwrap();
    let key = key_guard.as_ref().ok_or("Not logged in")?;
    
    // We generate a new salt for every save for better security
    // But wait, if we change the salt, the key derived from password will change?
    // NO. Key derivation depends on Password + Salt.
    // If we want to keep the SAME password working, we must store the salt used to derive the key.
    // BUT, here we already HAVE the key. We don't need the password.
    // We are encrypting data using the KEY.
    // The problem is: next time we load, we need to derive the SAME key from the password.
    // So we need to store the salt that was used to derive THIS key.
    
    // Actually, standard practice:
    // 1. Key Derivation: Password + Salt -> Key.
    // 2. Encryption: Key + IV (Nonce) -> Ciphertext.
    // The Salt used for Key Derivation must be stored so we can re-derive the Key.
    
    // In our current crypto.rs implementation:
    // EncryptedData contains 'salt'. This salt is used to derive the key.
    // When we save, we are re-encrypting.
    // If we generate a NEW salt, we would need a NEW key derived from the password with that new salt.
    // But we don't have the password here! We only have the OLD key.
    
    // So, we must reuse the salt that generated the current key?
    // OR, we change the design so that the Key is independent of the storage encryption?
    // (e.g. Key Encryption Key vs Data Encryption Key)
    
    // For simplicity in this refactor:
    // We should probably keep using the SAME key (and thus same salt) for the session.
    // But `crypto::encrypt` generates a new salt and derives a new key.
    // We need a `crypto::encrypt_with_key` that takes the Key and the Salt used to derive it.
    
    // Wait, `crypto::encrypt_with_key` takes `key` and `salt`.
    // The `salt` passed to `encrypt_with_key` is just stored in the output struct so it can be used for decryption later.
    // It doesn't affect the encryption process itself (which uses Key + Nonce).
    // BUT, for the user to be able to decrypt this file later using their password,
    // the salt stored in the file MUST be the one that, when combined with the password, produces the Key we used!
    
    // So we need to know the salt associated with the current Key.
    // We should store (Key, Salt) in AppState.
    
    // Let's adjust AppState.
    Err("Implementation update required: AppState needs salt".to_string())
}

// ... wait, I need to update AppState definition first.
// Let's do a multi-step replacement or just rewrite the whole block properly.

#[tauri::command]
fn save_passwords_secure(app: tauri::AppHandle, state: tauri::State<AppState>, data: String) -> Result<(), String> {
    let path = get_data_path(&app)?;
    
    let key_guard = state.key.lock().unwrap();
    let (key, salt) = key_guard.as_ref().ok_or("Not logged in")?;
    
    let encrypted = crypto::encrypt_with_key(&data, key, salt)?;
    
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(path, encrypted).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_passwords_secure(app: tauri::AppHandle, state: tauri::State<AppState>) -> Result<String, String> {
    let path = get_data_path(&app)?;
    if !path.exists() {
        return Ok("[]".to_string());
    }
    
    let key_guard = state.key.lock().unwrap();
    let (key, _) = key_guard.as_ref().ok_or("Not logged in")?;
    
    let encrypted = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let decrypted = crypto::decrypt_with_key(&encrypted, key)?;
    Ok(decrypted)
}

#[tauri::command]
fn initialize_database_secure(app: tauri::AppHandle, state: tauri::State<AppState>, path: String, master_password: String) -> Result<(), String> {
    let config_path = get_config_path(&app)?;
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let config = AppConfig { 
        data_path: path.clone(),
        window_width: None,
        window_height: None,
        window_x: None,
        window_y: None,
        auto_lock_minutes: 5,
    };
    let config_str = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    
    // Create empty database
    // Derive a new key/salt
    let (key, salt) = crypto::derive_key(&master_password, None)?;
    let encrypted = crypto::encrypt_with_key("[]", &key, &salt)?;
    
    let data_path = PathBuf::from(path);
    if let Some(parent) = data_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(data_path, encrypted).map_err(|e| e.to_string())?;
    
    // Set state
    *state.key.lock().unwrap() = Some((key, salt));
    
    Ok(())
}

#[tauri::command]
fn open_database_secure(app: tauri::AppHandle, state: tauri::State<AppState>, path: String, master_password: String) -> Result<(), String> {
    // Verify we can decrypt it
    let data_path = PathBuf::from(&path);
    if !data_path.exists() {
        return Err("File does not exist".to_string());
    }
    let encrypted = fs::read_to_string(&data_path).map_err(|e| e.to_string())?;
    
    // Extract salt
    let encrypted_data: crypto::EncryptedData = serde_json::from_str(&encrypted)
        .map_err(|e| format!("Invalid data format: {}", e))?;
        
    // Derive key
    let (key, salt) = crypto::derive_key(&master_password, Some(&encrypted_data.salt))?;
    
    // Try decrypting to verify
    crypto::decrypt_with_key(&encrypted, &key)?;
    
    // Save config
    let config_path = get_config_path(&app)?;
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let config = AppConfig { 
        data_path: path,
        window_width: None,
        window_height: None,
        window_x: None,
        window_y: None,
        auto_lock_minutes: 5,
    };
    let config_str = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    
    // Set state
    *state.key.lock().unwrap() = Some((key, salt));
    
    Ok(())
}

#[tauri::command]
fn is_initialized(app: tauri::AppHandle) -> Result<bool, String> {
    let config_path = get_config_path(&app)?;
    Ok(config_path.exists())
}

#[tauri::command]
fn save_window_state(app: tauri::AppHandle, width: f64, height: f64, x: f64, y: f64) -> Result<(), String> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        return Ok(()); // Not initialized yet, skip
    }
    
    let config_str = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let mut config: AppConfig = serde_json::from_str(&config_str).map_err(|e| e.to_string())?;
    
    config.window_width = Some(width);
    config.window_height = Some(height);
    config.window_x = Some(x);
    config.window_y = Some(y);
    
    let config_str = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn get_window_state(app: tauri::AppHandle) -> Result<Option<(f64, f64, f64, f64)>, String> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        return Ok(None);
    }
    
    let config_str = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&config_str).map_err(|e| e.to_string())?;
    
    if let (Some(w), Some(h), Some(x), Some(y)) = (config.window_width, config.window_height, config.window_x, config.window_y) {
        Ok(Some((w, h, x, y)))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn get_auto_lock_timeout(app: tauri::AppHandle) -> Result<u32, String> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        return Ok(5); // Default
    }
    
    let config_str = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&config_str).map_err(|e| e.to_string())?;
    
    Ok(config.auto_lock_minutes)
}

#[tauri::command]
fn set_auto_lock_timeout(app: tauri::AppHandle, minutes: u32) -> Result<(), String> {
    let config_path = get_config_path(&app)?;
    if !config_path.exists() {
        return Err("Not initialized".to_string());
    }
    
    let config_str = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let mut config: AppConfig = serde_json::from_str(&config_str).map_err(|e| e.to_string())?;
    
    config.auto_lock_minutes = minutes;
    
    let config_str = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .manage(AppState { key: Mutex::new(None) })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Restore window state
      let window = app.get_webview_window("main").unwrap();
      let app_handle = app.handle().clone();
      
      if let Ok(Some((width, height, x, y))) = get_window_state(app_handle) {
        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
          width: width as u32,
          height: height as u32,
        }));
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
          x: x as i32,
          y: y as i32,
        }));
      }
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        save_passwords_secure, 
        load_passwords_secure, 
        is_initialized,
        initialize_database_secure,
        open_database_secure,
        save_window_state,
        get_window_state,
        get_auto_lock_timeout,
        set_auto_lock_timeout,
        read_file_content,
        login,
        logout
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}
