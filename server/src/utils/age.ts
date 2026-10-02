/** Full years between birthDate and `now`. */
export const ageOn = (birthDate: Date | string, now = new Date()): number => {
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const beforeBirthday =
    now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

/**
 * Replaces the exact birth date with the age, for singles shown to someone
 * who doesn't handle them (the public pool, other matchmakers' proposals).
 */
export const withAge = <T extends { birthDate?: Date | string }>(doc: T) => {
  const { birthDate, ...rest } = doc;
  return { ...rest, ...(birthDate ? { age: ageOn(birthDate) } : {}) };
};
