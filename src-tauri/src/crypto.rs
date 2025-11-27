use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce
};
use argon2::{
    password_hash::{
        PasswordHasher, SaltString
    },
    Argon2
};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use secrecy::{Secret, ExposeSecret};

#[derive(Serialize, Deserialize)]
pub struct EncryptedData {
    pub ciphertext: String,
    pub nonce: String,
    pub salt: String,
}

pub fn derive_key(password: &str, salt_str: Option<&str>) -> Result<(Secret<Vec<u8>>, String), String> {
    let salt = if let Some(s) = salt_str {
        SaltString::from_b64(s).map_err(|e| format!("Invalid salt: {}", e))?
    } else {
        SaltString::generate(&mut OsRng)
    };

    let argon2 = Argon2::default();
    
    // Derive key from password and salt
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?;
    
    let hash = password_hash.hash.ok_or("Hash failed")?;
    // Use the first 32 bytes of the hash as the key (Argon2 default output is 32 bytes)
    let key_bytes = hash.as_bytes()[..32].to_vec();
    
    Ok((Secret::new(key_bytes), salt.to_string()))
}

pub fn encrypt_with_key(data: &str, key: &Secret<Vec<u8>>, salt: &str) -> Result<String, String> {
    let key_bytes = key.expose_secret();
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    
    let ciphertext = cipher.encrypt(&nonce, data.as_bytes())
        .map_err(|e| e.to_string())?;
        
    let encrypted_data = EncryptedData {
        ciphertext: general_purpose::STANDARD.encode(ciphertext),
        nonce: general_purpose::STANDARD.encode(nonce),
        salt: salt.to_string(),
    };
    
    serde_json::to_string(&encrypted_data).map_err(|e| e.to_string())
}

pub fn decrypt_with_key(data: &str, key: &Secret<Vec<u8>>) -> Result<String, String> {
    let encrypted_data: EncryptedData = serde_json::from_str(data)
        .map_err(|e| format!("Invalid data format: {}", e))?;
        
    let key_bytes = key.expose_secret();
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    
    let cipher = Aes256Gcm::new(key);
    
    let nonce_bytes = general_purpose::STANDARD.decode(&encrypted_data.nonce)
        .map_err(|e| format!("Invalid nonce: {}", e))?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext_bytes = general_purpose::STANDARD.decode(&encrypted_data.ciphertext)
        .map_err(|e| format!("Invalid ciphertext: {}", e))?;
        
    let plaintext = cipher.decrypt(nonce, ciphertext_bytes.as_ref())
        .map_err(|_| "Decryption failed (Wrong password?)".to_string())?;
        
    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

// Legacy helpers for backward compatibility if needed, or simple usage
pub fn encrypt(data: &str, password: &str) -> Result<String, String> {
    let (key, salt) = derive_key(password, None)?;
    encrypt_with_key(data, &key, &salt)
}

pub fn decrypt(data: &str, password: &str) -> Result<String, String> {
    let encrypted_data: EncryptedData = serde_json::from_str(data)
        .map_err(|e| format!("Invalid data format: {}", e))?;
    let (key, _) = derive_key(password, Some(&encrypted_data.salt))?;
    decrypt_with_key(data, &key)
}
