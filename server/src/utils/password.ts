import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';
// Unsalted SHA-256 hex digests written by older versions of the server.
const LEGACY_SHA256 = /^[a-f0-9]{64}$/;

/** Hashes a password as `scrypt$<salt hex>$<hash hex>` with a random per-user salt. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `${PREFIX}$${salt.toString('hex')}$${hash.toString('hex')}`;
};

const SCRYPT_FORMAT = new RegExp(
  `^${PREFIX}\\$[a-f0-9]{${SALT_BYTES * 2}}\\$[a-f0-9]{${KEY_LENGTH * 2}}$`
);

/** True if the value is already in our `scrypt$salt$hash` format. */
export const isHashed = (value: string): boolean => SCRYPT_FORMAT.test(value);

export const isLegacyHash = (value: string): boolean => LEGACY_SHA256.test(value);

/** Constant-time check of a password against a stored hash (scrypt or legacy SHA-256). */
export const verifyPassword = async (
  password: string,
  stored: string
): Promise<boolean> => {
  if (isLegacyHash(stored)) {
    const candidate = crypto.createHash('sha256').update(password).digest();
    return crypto.timingSafeEqual(candidate, Buffer.from(stored, 'hex'));
  }
  const [prefix, saltHex, hashHex] = stored.split('$');
  if (prefix !== PREFIX || !saltHex || !hashHex) {
    return false;
  }
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
};

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Why a new password is too weak, or null if it is fine: at least 8 characters,
 * with a letter and something that isn't a letter (digit, symbol or space).
 * Same rule as client/src/lib/password.ts.
 */
export const passwordProblem = (password: unknown): string | null => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/\p{L}/u.test(password) || !/[^\p{L}]/u.test(password)) {
    return 'Password needs a letter and a digit or symbol';
  }
  return null;
};
