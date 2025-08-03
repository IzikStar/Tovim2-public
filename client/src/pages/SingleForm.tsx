import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  marriageStatuses,
  sectors,
  ethnicities,
  interests,
  proposePreferences,
} from '../utils/enums';
import apiService, { MatchMaker } from '../services/api';

interface FormData {
  firstName: string;
  lastName: string;
  marriageStatus: string;
  age: string;
  height: string;
  ethnicity: string;
  customEthnicity: string;
  city: string;
  sectors: string[];
  customSector: string;
  workAndStudyPlaces: string;
  currentOccupation: string;
  basicDescription: string;
  freeDescription: string;
  interests: string[];
  otherInterests: string;
  futureVision: string;
  nonCompromisableAttributes: string;
  lookingForAttributes: string;
  appearanceMustHave: string;
  appearanceMustNotHave: string;
  generalDealBreakers: string;
  existingMatchProfile: string;
  shareInWhatsappGroups: string;
  proposePreference: string;
  phoneNumber: string;
  referencePhones: string;
  images: string[];
  nameForPrayer: string;
  referralSource: string;
  matchmakerExpectations: string;
}

const initialForm: FormData = {
  firstName: '',
  lastName: '',
  marriageStatus: marriageStatuses[0],
  age: '',
  height: '',
  ethnicity: ethnicities[0],
  customEthnicity: '',
  city: '',
  sectors: [],
  customSector: '',
  workAndStudyPlaces: '',
  currentOccupation: '',
  basicDescription: '',
  freeDescription: '',
  interests: [],
  otherInterests: '',
  futureVision: '',
  nonCompromisableAttributes: '',
  lookingForAttributes: '',
  appearanceMustHave: '',
  appearanceMustNotHave: '',
  generalDealBreakers: '',
  existingMatchProfile: '',
  shareInWhatsappGroups: 'לא',
  proposePreference: proposePreferences[2],
  phoneNumber: '',
  referencePhones: '',
  images: [],
  nameForPrayer: '',
  referralSource: '',
  matchmakerExpectations: '',
};

const SingleForm: React.FC = () => {
  const { matchmakerId } = useParams();
  const [form, setForm] = useState<FormData>(initialForm);
  const [matchmaker, setMatchmaker] = useState<MatchMaker | null>(null);

  useEffect(() => {
    if (matchmakerId) {
      apiService
        .getMatchmaker(matchmakerId)
        .then(setMatchmaker)
        .catch(() => {});
    }
  }, [matchmakerId]);

  if (!matchmakerId)
    return (
      <div>
        מצטערים, אי אפשר להירשם מקישור זה, יש ליצור קשר עם אחד השדכנים שלנו...
      </div>
    );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleArray = (name: keyof FormData, value: string) => {
    setForm((prev) => {
      const arr = prev[name] as string[];
      const exists = arr.includes(value);
      const updated = exists ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [name]: updated };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((images) => setForm((f) => ({ ...f, images })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - Number(form.age));
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      marriageStatus: form.marriageStatus,
      birthDate,
      height: form.height ? Number(form.height) : undefined,
      ethnicity: form.ethnicity,
      customEthnicity: form.customEthnicity || undefined,
      city: form.city,
      sectors: form.sectors,
      customSector: form.customSector || undefined,
      workAndStudyPlaces: form.workAndStudyPlaces.split('\n').filter(Boolean),
      currentOccupation: form.currentOccupation || undefined,
      basicDescription: form.basicDescription || undefined,
      freeDescription: form.freeDescription || undefined,
      interests: form.interests,
      otherInterests: form.otherInterests
        .split('\n')
        .filter(Boolean),
      futureVision: form.futureVision || undefined,
      nonCompromisableAttributes: form.nonCompromisableAttributes
        .split('\n')
        .filter(Boolean),
      lookingForAttributes: form.lookingForAttributes
        .split('\n')
        .filter(Boolean),
      appearanceMustHave: form.appearanceMustHave || undefined,
      appearanceMustNotHave: form.appearanceMustNotHave || undefined,
      generalDealBreakers: form.generalDealBreakers || undefined,
      existingMatchProfile: form.existingMatchProfile || undefined,
      shareInWhatsappGroups: form.shareInWhatsappGroups === 'כן',
      proposePreference: form.proposePreference,
      phoneNumber: form.phoneNumber,
      referencePhones: form.referencePhones.split('\n').filter(Boolean),
      images: form.images,
      nameForPrayer: form.nameForPrayer || undefined,
      referralSource: form.referralSource || undefined,
      matchmakerExpectations: form.matchmakerExpectations || undefined,
    };
    try {
      const res = await fetch(`/singles/register/${matchmakerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit');
      alert('פרטים נשלחו לשדכן');
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשליחת הטופס');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>שאלון הכרות</h2>
      {matchmaker && (
        <div style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
          <p>
            שלום לך,\nאנחנו שמחים שהגעת למאגר שלנו\n\nבנינו כאן במחשבה רבה ומעמיקה שאלון הכרות לא־שגרתי, עם כמה שאלות שאולי לא נשאלת עד היום.\nנשמח שתקדיש/י את הזמן הנדרש כדי לענות בצורה כנה ומדויקת כמה שיותר על השאלות – בשבילך ובשבילנו, כך תכיר/י את עצמך יותר טוב, וגם אנחנו נכיר אותך.\n\nחשוב לציין שטווח הגילאים שאנחנו משדכים הינו לרוב {matchmaker.ageRange?.min}-{matchmaker.ageRange?.max}.\n\nכאן בשבילך. {matchmaker.firstName} – {matchmaker.phoneNumber}
          </p>
          <p>תחומי התמחות: {matchmaker.expertSectors.join(', ')}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>😃 שם פרטי:</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} required />
        </div>
        <div>
          <label>👨‍👩‍👧‍👦 שם משפחה:</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
        <div>
          <label>👤 סטטוס:</label>
          <select name="marriageStatus" value={form.marriageStatus} onChange={handleChange}>
            {marriageStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label>🎂 גיל:</label>
          <input type="number" name="age" value={form.age} onChange={handleChange} required />
        </div>
        <div>
          <label>🌱 גובה:</label>
          <input type="number" name="height" value={form.height} onChange={handleChange} />
        </div>
        <div>
          <label>🕍 עדה:</label>
          <select name="ethnicity" value={form.ethnicity} onChange={handleChange}>
            {ethnicities.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          {form.ethnicity === 'אחר/ת' && (
            <input
              name="customEthnicity"
              value={form.customEthnicity}
              onChange={handleChange}
              placeholder="פירוט"
            />
          )}
        </div>
        <div>
          <label>🏠 מקום מגורים:</label>
          <input name="city" value={form.city} onChange={handleChange} required />
        </div>
        <div>
          <label>🫱🏿‍🫲🏻 סגנון דתי:</label>
          {sectors.map((s) => (
            <label key={s} style={{ marginRight: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.sectors.includes(s)}
                onChange={() => toggleArray('sectors', s)}
              />
              {s}
            </label>
          ))}
          {form.sectors.includes('אחר/ת') && (
            <input
              name="customSector"
              value={form.customSector}
              onChange={handleChange}
              placeholder="פירוט"
            />
          )}
        </div>
        <div>
          <label>👩‍🏫 מוסדות לימוד שלמדת בהם ומקומות שעבדת בהם במהלך החיים (נא לפרט):</label>
          <textarea
            name="workAndStudyPlaces"
            value={form.workAndStudyPlaces}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>🎓 מה את/ה עושה בחיים כיום (נא לפרט):</label>
          <textarea
            name="currentOccupation"
            value={form.currentOccupation}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>📝 ספר/י לנו על עצמך בצורה טכנית (דתית, אופי וכו׳):</label>
          <textarea
            name="basicDescription"
            value={form.basicDescription}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>🤓 ספר/י לנו על עצמך דברים נוספים, בצורה הכי מעניינת! (פרטי טריוויה):</label>
          <textarea
            name="freeDescription"
            value={form.freeDescription}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>🏓 תחומי עניין בולטים שלך:</label>
          {interests.map((i) => (
            <label key={i} style={{ marginRight: '0.5rem' }}>
              <input
                type="checkbox"
                checked={form.interests.includes(i)}
                onChange={() => toggleArray('interests', i)}
              />
              {i}
            </label>
          ))}
          <textarea
            name="otherInterests"
            value={form.otherInterests}
            onChange={handleChange}
            placeholder="פרטים נוספים"
            rows={2}
          />
        </div>
        <div>
          <label>🧑‍🎓 איפה את/ה רואה את עצמך בעתיד:</label>
          <textarea
            name="futureVision"
            value={form.futureVision}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>💍 ארבעה דברים (!) שקריטיים לך שיהיו בבן/ת הזוג:</label>
          <textarea
            name="nonCompromisableAttributes"
            value={form.nonCompromisableAttributes}
            onChange={handleChange}
            rows={4}
          />
        </div>
        <div>
          <label>🔍 מה עוד תשמח/י שיהיה בבן/ת הזוג אבל תוכל/י להסתדר גם בלעדיהם:</label>
          <textarea
            name="lookingForAttributes"
            value={form.lookingForAttributes}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>👀 מה חשוב לך שיהיה בבן/בת מבחינה חיצונית?</label>
          <textarea
            name="appearanceMustHave"
            value={form.appearanceMustHave}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div>
          <label>🚫 מה חשוב לך שלא יהיה בבן/בת מבחינה חיצונית?</label>
          <textarea
            name="appearanceMustNotHave"
            value={form.appearanceMustNotHave}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div>
          <label>👎 מה חשוב לך שלא יהיה בבן/ת הזוג (תכונות, עיסוק, עדה וכו׳):</label>
          <textarea
            name="generalDealBreakers"
            value={form.generalDealBreakers}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>💳 העתק/העתיקי לכאן את כרטיס השידוכים הרגיל שלך:</label>
          <textarea
            name="existingMatchProfile"
            value={form.existingMatchProfile}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>📩 האם תרצה/י שנשלח את הכרטיס שצירפת בקבוצות ווטסאפ יעודיות?</label>
          <select
            name="shareInWhatsappGroups"
            value={form.shareInWhatsappGroups}
            onChange={handleChange}
          >
            <option value="כן">כן</option>
            <option value="לא">לא</option>
          </select>
        </div>
        <div>
          <label>✅ במידה ויש רעיון להצעה, תרצ/י שנציע קודם לך או לצד השני?</label>
          <select
            name="proposePreference"
            value={form.proposePreference}
            onChange={handleChange}
          >
            {proposePreferences.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label>📱 מספר טלפון שלך:</label>
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
        </div>
        <div>
          <label>📞 מספרים לבירור (מספר ושם):</label>
          <textarea
            name="referencePhones"
            value={form.referencePhones}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div>
          <label>📸 צרפ/י לפחות שתי תמונות שלך (פנים + כל גוף):</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
        </div>
        <div>
          <label>🪬 אפשר להשאיר שם לתפילה לזיווג הגון ונשתדל להתפלל:</label>
          <textarea
            name="nameForPrayer"
            value={form.nameForPrayer}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div>
          <label>🖊 אם תרצה/י לכתוב עוד משהו. (איך הגעת אלינו):</label>
          <textarea
            name="referralSource"
            value={form.referralSource}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div>
          <label>🫡 מה הציפיות שלך מאיתנו (השדכנים):</label>
          <textarea
            name="matchmakerExpectations"
            value={form.matchmakerExpectations}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <button type="submit">שליחה</button>
      </form>
    </div>
  );
};

export default SingleForm;
