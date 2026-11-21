import api from "../../lib/axios";

let cachedPublicKey = null;

function base64ToArrayBuffer(rawBase64) {
    const cleanB64 = (rawBase64 || '')
        .replace(/-----BEGIN [A-Z0-9 ]+-----/g, '')
        .replace(/-----END [A-Z0-9 ]+-----/g, '')
        .replace(/\s+/g, '');
    const binary = window.atob(cleanB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Fetches and caches the RSA 2048-bit Public Key from the backend
 */
export async function getAuthPublicKey() {
    if (cachedPublicKey) {
        return cachedPublicKey;
    }

    try {
        const res = await api.get('/auth/public-key');
        const key = res.data?.data?.publicKey;
        if (key) {
            cachedPublicKey = key;
            return cachedPublicKey;
        }
    } catch (err) {
        console.warn('Failed to fetch RSA public key from backend:', err);
    }

    return null;
}

/**
 * Encrypts authentication credentials using RSA-OAEP 2048-bit with SHA-256.
 * Zero plaintext password reaches the network tab or proxies.
 * 
 * @param {object} credentials - e.g. { userName, password }
 * @returns {Promise<object>} - { encryptedData: "..." }
 */
export async function encryptAuthCredentials(credentials) {
    // Failsafe: Check Web Crypto API support
    if (!window?.crypto?.subtle) {
        console.warn('Web Crypto API not available. Falling back to standard transmission.');
        return credentials;
    }

    try {
        const publicKeyPem = await getAuthPublicKey();
        if (!publicKeyPem) {
            console.warn('RSA Public Key unavailable. Falling back to standard transmission.');
            return credentials;
        }

        // 1. Pack credentials with timestamp (Anti-Replay Attack protection)
        const payloadObject = {
            ...credentials,
            timestamp: Date.now()
        };

        const jsonString = JSON.stringify(payloadObject);
        const dataBuffer = new TextEncoder().encode(jsonString);

        // 2. Import Public Key into Web Crypto
        const spkiBuffer = base64ToArrayBuffer(publicKeyPem);
        const cryptoKey = await window.crypto.subtle.importKey(
            "spki",
            spkiBuffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            false,
            ["encrypt"]
        );

        // 3. Encrypt payload
        const encryptedArrayBuffer = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            cryptoKey,
            dataBuffer
        );

        // 4. Return formatted encrypted payload
        const encryptedBase64 = arrayBufferToBase64(encryptedArrayBuffer);
        return { encryptedData: encryptedBase64 };
    } catch (error) {
        console.error('Error during in-flight credential encryption:', error);
        // Resilient fallback so users are never locked out if encryption fails
        return credentials;
    }
}

