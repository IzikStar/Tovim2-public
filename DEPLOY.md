# פריסה חיה (Render + MongoDB Atlas)

האפליקציה נפרסת כשירות אחד בחינם ב-Render: השרת מגיש גם את ה-API (תחת `/api`) וגם את האתר.
מסד הנתונים הוא אשכול חינמי ב-MongoDB Atlas. בהפעלה הראשונה נטענים נתוני הדמו.

## 1. מסד נתונים (MongoDB Atlas)

1. נרשמים ב-https://cloud.mongodb.com ויוצרים אשכול **M0 (Free)**.
2. **Database Access** ← Add New Database User: שם משתמש וסיסמה (בלי תווים מיוחדים, כדי לא לקודד אותם ב-URI).
3. **Network Access** ← Add IP Address ← **Allow access from anywhere** (`0.0.0.0/0`). ל-Render בחינם אין IP קבוע.
4. **Connect** ← Drivers ← מעתיקים את מחרוזת החיבור ומוסיפים שם מסד לפני ה-`?`:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/tovim?retryWrites=true&w=majority
   ```

## 2. שרת ואתר (Render)

1. נרשמים ב-https://render.com עם חשבון GitHub ומאשרים גישה לריפו `Tovim2`.
2. **New** ← **Blueprint** ← בוחרים את `IzikStar/Tovim2` (ענף `main`). Render קורא את `render.yaml`.
3. כשמתבקשים, מדביקים ב-`MONGO_URI` את המחרוזת משלב 1 ← **Apply**.
4. אחרי הבנייה האתר זמין בכתובת `https://tovim-XXXX.onrender.com`.

כניסת דמו: `rachel@demo.tovim.example` / `demo-password` (או `yosef@demo.tovim.example`).

## הערות

- בתוכנית החינמית השירות נרדם אחרי כ-15 דקות בלי תנועה, והבקשה הראשונה אחרי זה לוקחת כחצי דקה.
- כל push ל-`main` פורס מחדש אוטומטית.
- נתוני הדמו נטענים רק אם הם לא קיימים, כך שהפעלה מחדש לא מוחקת שינויים. לביטול: מגדירים `SEED_DEMO=false` ב-Render.
