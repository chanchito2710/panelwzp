import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'panel-whatsapp-secret-key-32ch'; // 32 caracteres
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// Derivar clave desde SECRET_KEY
function getKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(SECRET_KEY, salt, 100000, 32, 'sha512');
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = getKey(salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

export function decrypt(encryptedData: string): string {
    try {
        const data = Buffer.from(encryptedData, 'base64');

        const salt = data.subarray(0, SALT_LENGTH);
        const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
        const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = data.subarray(ENCRYPTED_POSITION);

        const key = getKey(salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    } catch (error) {
        console.error('Error al desencriptar:', error);
        return encryptedData; // Devolver original si falla
    }
}

export function encryptSensitiveFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
): T {
    const result = { ...obj };
    
    for (const field of fieldsToEncrypt) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = encrypt(result[field] as string) as T[keyof T];
        }
    }
    
    return result;
}

export function decryptSensitiveFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[]
): T {
    const result = { ...obj };
    
    for (const field of fieldsToDecrypt) {
        if (result[field] && typeof result[field] === 'string') {
            result[field] = decrypt(result[field] as string) as T[keyof T];
        }
    }
    
    return result;
}
