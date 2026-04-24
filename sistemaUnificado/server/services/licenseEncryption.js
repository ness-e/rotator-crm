/**
 * License Encryption Service
 * 
 * Implements the XOR encryption algorithm from the legacy PHP system.
 * Uses a magic word (default: "yiyo") to XOR-encrypt the activation key
 * that the Rotator Survey desktop software uses for license validation.
 * 
 * The plaintext contains all license limits and expiration info so the
 * desktop app can decrypt it locally and enforce restrictions.
 */

const DEFAULT_MAGIC_WORD = 'yiyo';

/**
 * Build the plaintext activation key string from license data.
 * 
 * Format: V{Major}-{Minor}.{hardwareId}.{versionId}.{day}.{month}.{year}.
 *         {expDay}.{expMonth}.{expYear}.{hostingId}.{serverId}.
 *         {admins}.{mobiles}.{phones}.{dataEntries}.{analysts}.
 *         {classifiers}.{captureSups}.{kioskSups}.{clients}.{questions}
 * 
 * @param {Object} data
 * @returns {string} Plaintext activation key
 */
export function buildActivationPlaintext(data) {
    const now = new Date();
    const exp = new Date(data.expirationDate);

    const major = data.softwareVersionMajor || '4';
    const minor = data.softwareVersionMinor || '3';
    const hardwareId = data.hardwareId || '0';
    const versionId = data.versionId ?? '0';

    const parts = [
        `V${major}-${minor}`,
        hardwareId,
        versionId,
        now.getDate(),
        now.getMonth() + 1,
        now.getFullYear(),
        exp.getDate(),
        exp.getMonth() + 1,
        exp.getFullYear(),
        data.hostingPlanId ?? 0,
        data.serverType ?? 0,
        data.admins ?? 0,
        data.mobiles ?? 0,
        data.phones ?? 0,
        data.dataEntries ?? 0,
        data.analysts ?? 0,
        data.classifiers ?? 0,
        data.captureSups ?? 0,
        data.kioskSups ?? 0,
        data.clients ?? 0,
        data.questions ?? 0,
    ];

    return parts.join('.');
}

/**
 * Encrypt a plaintext string using XOR with a cyclic key.
 * Each character is XOR'd with the corresponding key character,
 * producing a hex pair (2 hex chars) per byte.
 * 
 * @param {string} plaintext - The text to encrypt
 * @param {string} [key] - The XOR key (default: "yiyo")
 * @returns {string} Hex-encoded encrypted string (uppercase)
 */
export function xorEncrypt(plaintext, key = DEFAULT_MAGIC_WORD) {
    let result = '';
    const keyLen = key.length;

    for (let i = 0; i < plaintext.length; i++) {
        const xorVal = key.charCodeAt(i % keyLen) ^ plaintext.charCodeAt(i);
        result += xorVal.toString(16).toUpperCase().padStart(2, '0');
    }

    return result;
}

/**
 * Decrypt a hex-encoded XOR-encrypted string back to plaintext.
 * 
 * @param {string} hex - The hex-encoded encrypted string
 * @param {string} [key] - The XOR key (default: "yiyo")
 * @returns {string} Decrypted plaintext
 */
export function xorDecrypt(hex, key = DEFAULT_MAGIC_WORD) {
    let result = '';
    const keyLen = key.length;

    for (let i = 0; i < hex.length; i += 2) {
        const xorVal = parseInt(hex.substring(i, i + 2), 16);
        const originalChar = xorVal ^ key.charCodeAt((i / 2) % keyLen);
        result += String.fromCharCode(originalChar);
    }

    return result;
}

/**
 * Generate the full encrypted activation key for a license.
 * This is the value stored in License.encryptedActivationKey and
 * sent to the desktop software for local validation.
 * 
 * @param {Object} licenseData - All license limits and metadata
 * @param {string} [magicWord] - XOR key override
 * @returns {string} Hex-encoded encrypted activation key
 */
export function generateEncryptedActivationKey(licenseData, magicWord = DEFAULT_MAGIC_WORD) {
    const plaintext = buildActivationPlaintext(licenseData);
    return xorEncrypt(plaintext, magicWord);
}

/**
 * Verify an encrypted activation key by decrypting and parsing it.
 * 
 * @param {string} encryptedKey - Hex-encoded encrypted key
 * @param {string} [magicWord] - XOR key override
 * @returns {Object} Parsed activation key data
 */
export function decryptActivationKey(encryptedKey, magicWord = DEFAULT_MAGIC_WORD) {
    const plaintext = xorDecrypt(encryptedKey, magicWord);
    const parts = plaintext.split('.');

    if (parts.length < 21) {
        return { valid: false, plaintext, error: 'Insufficient parts in decrypted key' };
    }

    return {
        valid: true,
        plaintext,
        version: parts[0],
        hardwareId: parts[1],
        versionId: parseInt(parts[2]),
        activationDay: parseInt(parts[3]),
        activationMonth: parseInt(parts[4]),
        activationYear: parseInt(parts[5]),
        expirationDay: parseInt(parts[6]),
        expirationMonth: parseInt(parts[7]),
        expirationYear: parseInt(parts[8]),
        hostingPlanId: parseInt(parts[9]),
        serverType: parseInt(parts[10]),
        admins: parseInt(parts[11]),
        mobiles: parseInt(parts[12]),
        phones: parseInt(parts[13]),
        dataEntries: parseInt(parts[14]),
        analysts: parseInt(parts[15]),
        classifiers: parseInt(parts[16]),
        captureSups: parseInt(parts[17]),
        kioskSups: parseInt(parts[18]),
        clients: parseInt(parts[19]),
        questions: parseInt(parts[20]),
    };
}
