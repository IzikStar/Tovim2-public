export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_HINT = 'לפחות 8 תווים, עם אות וגם ספרה או סימן';

/**
 * Why a new password is too weak, or null if it is fine: at least 8 characters,
 * with a letter and something that isn't a letter (digit, symbol or space).
 * Same rule as server/src/utils/password.ts.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `לפחות ${MIN_PASSWORD_LENGTH} תווים`;
  if (!/\p{L}/u.test(password) || !/[^\p{L}]/u.test(password)) return 'צריך אות וגם ספרה או סימן';
  return null;
}

export type PasswordStrength = 'weak' | 'ok' | 'strong';

/** A rough meter for the form: weak fails the rule, strong is long or mixes several kinds of characters. */
export function passwordStrength(password: string): PasswordStrength {
  if (passwordProblem(password)) return 'weak';
  const kinds = [/\p{Ll}/u, /\p{Lu}/u, /\d/, /[^\p{L}\d]/u].filter((re) => re.test(password)).length;
  return password.length >= 12 || kinds >= 3 ? 'strong' : 'ok';
}
