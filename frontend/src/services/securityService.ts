/**
 * A simple implementation of client-side encryption for E2EE demonstration.
 * In a production scenario, we'd use a real key exchange like Diffie-Hellman.
 * For this phase, we derive a key deterministically from the user IDs
 * so that both participants have the same key without extra negotiation.
 */

const getCryptoKey = async (userId1: string, userId2: string) => {
    // Sort IDs to ensure consistency for both users
    const sortedIds = [userId1, userId2].sort().join(':');
    const encoder = new TextEncoder();
    const data = encoder.encode(sortedIds);

    // Use SHA-256 for a fixed-size seed
    const hash = await crypto.subtle.digest('SHA-256', data);

    // Import as an AES-GCM key
    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
};

export const encryptPayload = async (text: string, userId1: string, userId2: string) => {
    try {
        const key = await getCryptoKey(userId1, userId2);
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommended IV size

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        // Package IV + Ciphertext for transmission (Base64)
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (err) {
        console.error("Encryption failed:", err);
        return text; // Fallback to plain text on error
    }
};

export const decryptPayload = async (base64Data: string, userId1: string, userId2: string) => {
    try {
        const key = await getCryptoKey(userId1, userId2);
        const combined = new Uint8Array(
            atob(base64Data).split('').map(char => char.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (err) {
        // console.error("Decryption failed:", err);
        return "[Encrypted Message]"; // Or return text if it failed
    }
};
