import { describe, expect, it } from 'vitest';
import { passwordProblem, passwordStrength } from './password';

describe('passwordProblem', () => {
  it('needs 8 characters', () => {
    expect(passwordProblem('ab1')).toBe('לפחות 8 תווים');
  });

  it('needs a letter and a non-letter', () => {
    expect(passwordProblem('onlyletters')).toBe('צריך אות וגם ספרה או סימן');
    expect(passwordProblem('1234567890')).toBe('צריך אות וגם ספרה או סימן');
  });

  it('accepts digits, symbols, spaces and Hebrew letters', () => {
    expect(passwordProblem('letters12')).toBeNull();
    expect(passwordProblem('demo-password')).toBeNull();
    expect(passwordProblem('correct horse battery')).toBeNull();
    expect(passwordProblem('שלוםעולם7')).toBeNull();
  });
});

describe('passwordStrength', () => {
  it('grades weak, ok and strong', () => {
    expect(passwordStrength('short')).toBe('weak');
    expect(passwordStrength('letters12')).toBe('ok');
    expect(passwordStrength('Letters12!')).toBe('strong');
    expect(passwordStrength('a much longer passphrase')).toBe('strong');
  });
});
