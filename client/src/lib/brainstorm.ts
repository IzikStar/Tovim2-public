import type { BrainstormMode } from '../api/types';

export const MODE_INFO: Record<BrainstormMode, { label: string; description: string }> = {
  random: { label: 'שני מועמדים אקראיים', description: 'זוג רנדומלי, בלי לסנן לפי מה שביקשו. לפעמים זה בדיוק מה שצריך.' },
  pool: { label: 'קלף מהמאגר', description: 'אחד מהמועמדים שלך עם מישהו מהמאגר המשותף של שדכנים אחרים.' },
  waiting: { label: 'מי מחכה הכי הרבה', description: 'מי שהכי הרבה זמן בלי הצעה פתוחה, עם ההתאמה הכי טובה שמצאנו לו/ה.' },
  outside: { label: 'מחוץ לקופסה', description: 'זוגות שלא עומדים במגזר או בגיל שביקשו, אבל יש להם הרבה במשותף.' },
  single: { label: 'סביב מועמד/ת אחד/ת', description: 'כמה כיוונים אקראיים למועמד/ת שבוחרים.' },
};

/** Questions that help look at the people you handle from a new angle. */
export const THINKING_PROMPTS = [
  'מי מהמועמדים שלך הכי השתנה בשנה האחרונה? האם מה שהוא/היא מחפש/ת השתנה איתו/ה?',
  'במי פגשת לאחרונה (בשמחה, בבית כנסת, בעבודה) שעוד לא נמצא/ת במאגר?',
  'איזו דרישה של אחד המועמדים אולי פחות חשובה ממה שנדמה? שווה לשאול אותו/ה.',
  'מי מהמועמדים יצא/ה לאחרונה לפגישה שלא הצליחה? מה למדת ממנה על מה שמתאים לו/ה?',
  'אם היית צריך/ה להציע לכל מועמד/ת מישהו מעיר אחרת, את מי היית בוחר/ת?',
  'מי מהחברים או ההורים של המועמדים יכול/ה לספר עליהם משהו שעוד לא יודעים?',
  'איזה שדכן/ית אחר/ת מכיר/ה קהל שונה משלך? אולי כדאי לשלוח לו/ה בקשה.',
  'מי מהמועמדים שלך הכי שקט/ה? מתי דיברת איתו/ה בפעם האחרונה?',
  'נסה/י לתאר כל מועמד/ת במשפט אחד בלי גיל ומגזר. מי מהם מתאים לאותו משפט?',
  'מי ביקש/ה טווח גילאים צר? מה היה קורה אם מרחיבים אותו בשנתיים?',
];

/** A random item that differs from `current` when there is more than one. */
export function pickDifferent<T>(items: readonly T[], current?: T, random = Math.random): T {
  const options = items.length > 1 ? items.filter((x) => x !== current) : items;
  return options[Math.floor(random() * options.length)];
}
