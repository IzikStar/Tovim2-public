import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  marriageStatuses,
  sectors,
  ethnicities,
  interests,
  proposePreferences,
} from '../utils/enums';
import apiService, { MatchMaker } from '../services/api';
import styles from './SingleForm.module.css';
import ProgressBar from '../components/ProgressBar';
import QuestionBlock from '../components/QuestionBlock';

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
  workAndStudyPlaces: string[];
  currentOccupation: string;
  basicDescription: string;
  freeDescription: string;
  interests: string[];
  otherInterests: string[];
  futureVision: string;
  nonCompromisableAttributes: string[];
  lookingForAttributes: string[];
  appearanceMustHave: string;
  appearanceMustNotHave: string;
  generalDealBreakers: string;
  existingMatchProfile: string;
  shareInWhatsappGroups: string;
  proposePreference: string;
  phoneNumber: string;
  referencePhones: string[];
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
  sectors: [sectors[0]],
  customSector: '',
  workAndStudyPlaces: [''],
  currentOccupation: '',
  basicDescription: '',
  freeDescription: '',
  interests: [],
  otherInterests: [''],
  futureVision: '',
  nonCompromisableAttributes: ['', '', '', ''],
  lookingForAttributes: [''],
  appearanceMustHave: '',
  appearanceMustNotHave: '',
  generalDealBreakers: '',
  existingMatchProfile: '',
  shareInWhatsappGroups: 'לא',
  proposePreference: proposePreferences[2],
  phoneNumber: '',
  referencePhones: [''],
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
        .catch((err) => console.error('failed to load matchmaker', err));
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

  const updateArray = (name: keyof FormData, index: number, value: string) => {
    setForm((prev) => {
      const arr = [...(prev[name] as string[])];
      arr[index] = value;
      return { ...prev, [name]: arr };
    });
  };

  const addArrayItem = (name: keyof FormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: [...(prev[name] as string[]), value],
    }));
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
      sectors: form.sectors.filter(Boolean),
      customSector: form.customSector || undefined,
      workAndStudyPlaces: form.workAndStudyPlaces.filter(Boolean),
      currentOccupation: form.currentOccupation || undefined,
      basicDescription: form.basicDescription || undefined,
      freeDescription: form.freeDescription || undefined,
      interests: form.interests.filter(Boolean),
      otherInterests: form.otherInterests.filter(Boolean),
      futureVision: form.futureVision || undefined,
      nonCompromisableAttributes: form.nonCompromisableAttributes,
      lookingForAttributes: form.lookingForAttributes.filter(Boolean),
      appearanceMustHave: form.appearanceMustHave || undefined,
      appearanceMustNotHave: form.appearanceMustNotHave || undefined,
      generalDealBreakers: form.generalDealBreakers || undefined,
      existingMatchProfile: form.existingMatchProfile || undefined,
      shareInWhatsappGroups: form.shareInWhatsappGroups === 'כן',
      proposePreference: form.proposePreference,
      phoneNumber: form.phoneNumber,
      referencePhones: form.referencePhones.filter(Boolean),
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

  const questionKeys: (keyof FormData)[] = useMemo(
    () => [
      'firstName',
      'lastName',
      'marriageStatus',
      'age',
      'height',
      'ethnicity',
      'city',
      'sectors',
      'workAndStudyPlaces',
      'currentOccupation',
      'basicDescription',
      'freeDescription',
      'interests',
      'futureVision',
      'nonCompromisableAttributes',
      'lookingForAttributes',
      'appearanceMustHave',
      'appearanceMustNotHave',
      'generalDealBreakers',
      'existingMatchProfile',
      'shareInWhatsappGroups',
      'proposePreference',
      'phoneNumber',
      'referencePhones',
      'images',
      'nameForPrayer',
      'referralSource',
      'matchmakerExpectations',
    ],
    []
  );

  const progress = useMemo(() => {
    const answered = questionKeys.filter((key) => {
      const value = form[key];
      if (Array.isArray(value)) {
        return value.some((v) => v);
      }
      return value !== '' && value !== undefined && value !== null;
    }).length;
    return Math.round((answered / questionKeys.length) * 100);
  }, [form, questionKeys]);

  return (
    <div className={styles.container}>
      <ProgressBar percent={progress} />
      <h2>שאלון הכרות</h2>
      {matchmaker && (
        <div style={{ whiteSpace: 'pre-line', marginBottom: '1rem' }}>
          <p>
            שלום לך,\nאנחנו שמחים שהגעת למאגר שלנו\n\nבנינו כאן במחשבה רבה ומעמיקה שאלון הכרות לא־שגרתי, עם כמה שאלות שאולי לא נשאלת עד היום.\nנשמח שתקדיש/י את הזמן הנדרש כדי לענות בצורה כנה ומדויקת כמה שיותר על השאלות – בשבילך ובשבילנו, כך תכיר/י את עצמך יותר טוב, וגם אנחנו נכיר אותך.\n\nמגזרי התמחות: {matchmaker.expertSectors.join(', ')}.\nחשוב לציין שטווח הגילאים שאנחנו משדכים הינו לרוב {matchmaker.ageRange?.min}-{matchmaker.ageRange?.max}.\nכאן בשבילך. {matchmaker.firstName}- {matchmaker.phoneNumber}
          </p>
        </div>
      )}
      <form className={styles.form} onSubmit={handleSubmit}>
        <QuestionBlock label="😃 שם פרטי:">
          <input name="firstName" value={form.firstName} onChange={handleChange} required />
        </QuestionBlock>
        <QuestionBlock label="👨‍👩‍👧‍👦 שם משפחה:">
          <input name="lastName" value={form.lastName} onChange={handleChange} required />
        </QuestionBlock>
        <QuestionBlock label="👤 סטטוס:">
          <select name="marriageStatus" value={form.marriageStatus} onChange={handleChange}>
            {marriageStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </QuestionBlock>
        <QuestionBlock label="🎂 גיל:">
          <input type="number" name="age" value={form.age} onChange={handleChange} required />
        </QuestionBlock>
        <QuestionBlock label="🌱 גובה:">
          <input type="number" name="height" value={form.height} onChange={handleChange} />
        </QuestionBlock>
        <QuestionBlock label="🕍 עדה:">
          <>
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
          </>
        </QuestionBlock>
        <QuestionBlock label="🏠 מקום מגורים:">
          <input name="city" value={form.city} onChange={handleChange} required />
        </QuestionBlock>
        <QuestionBlock label="🫱🏿‍🫲🏻 סגנון דתי:">
          <>
            {form.sectors.map((s, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <select
                  value={s}
                  onChange={(e) => updateArray('sectors', idx, e.target.value)}
                >
                  {sectors.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('sectors', sectors[0])}>
              הוסף מגזר
            </button>
            {form.sectors.includes('אחר/ת') && (
              <input
                name="customSector"
                value={form.customSector}
                onChange={handleChange}
                placeholder="פירוט"
              />
            )}
          </>
        </QuestionBlock>
        <QuestionBlock label="👩‍🏫 מוסדות לימוד שלמדת בהם ומקומות שעבדת בהם במהלך החיים (נא לפרט):">
          <>
            {form.workAndStudyPlaces.map((w, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <input
                  value={w}
                  onChange={(e) => updateArray('workAndStudyPlaces', idx, e.target.value)}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={() => addArrayItem('workAndStudyPlaces', '')}
            >
              הוסף מקום
            </button>
          </>
        </QuestionBlock>
        <QuestionBlock label="🎓 מה את/ה עושה בחיים כיום (נא לפרט):">
          <textarea
            name="currentOccupation"
            value={form.currentOccupation}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="📝 ספר/י לנו על עצמך בצורה טכנית (דתית, אופי וכו׳):">
          <textarea
            name="basicDescription"
            value={form.basicDescription}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="🤓 ספר/י לנו על עצמך דברים נוספים, בצורה הכי מעניינת! (פרטי טריוויה):">
          <textarea
            name="freeDescription"
            value={form.freeDescription}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="🏓 תחומי עניין בולטים שלך:">
          <>
            {form.interests.map((i, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <select
                  value={i}
                  onChange={(e) => updateArray('interests', idx, e.target.value)}
                >
                  {interests.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('interests', interests[0])}>
              הוסף תחום עניין
            </button>
            {form.interests.includes('אחר/ת') && (
              <>
                {form.otherInterests.map((o, idx) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <input
                      value={o}
                      onChange={(e) => updateArray('otherInterests', idx, e.target.value)}
                      placeholder="פרט"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => addArrayItem('otherInterests', '')}
                >
                  הוסף תחום נוסף
                </button>
              </>
            )}
          </>
        </QuestionBlock>
        <QuestionBlock label="🧑‍🎓 איפה את/ה רואה את עצמך בעתיד:">
          <textarea
            name="futureVision"
            value={form.futureVision}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="💍 ארבעה דברים (!) שקריטיים לך שיהיו בבן/ת הזוג (בלי – לא תצא/י לדייט):">
          <>
            {form.nonCompromisableAttributes.map((a, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <input
                  value={a}
                  onChange={(e) =>
                    updateArray('nonCompromisableAttributes', idx, e.target.value)
                  }
                />
              </div>
            ))}
          </>
        </QuestionBlock>
        <QuestionBlock label="🔍 מה עוד תשמח/י שיהיה בבן/ת הזוג אבל תוכל/י להסתדר גם בלעדיהם:">
          <>
            {form.lookingForAttributes.map((a, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <input
                  value={a}
                  onChange={(e) => updateArray('lookingForAttributes', idx, e.target.value)}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={() => addArrayItem('lookingForAttributes', '')}
            >
              הוסף תכונה
            </button>
          </>
        </QuestionBlock>
        <QuestionBlock label="👀 מה חשוב לך שיהיה בבן/בת מבחינה חיצונית?">
          <textarea
            name="appearanceMustHave"
            value={form.appearanceMustHave}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="🚫 מה חשוב לך שלא יהיה בבן/בת מבחינה חיצונית?">
          <textarea
            name="appearanceMustNotHave"
            value={form.appearanceMustNotHave}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="👎 מה חשוב לך שלא יהיה בבן/ת הזוג (תכונות, עיסוק, עדה וכו׳):">
          <textarea
            name="generalDealBreakers"
            value={form.generalDealBreakers}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="💳 העתק/העתיקי לכאן את כרטיס השידוכים הרגיל שלך (לעינינו בלבד):">
          <textarea
            name="existingMatchProfile"
            value={form.existingMatchProfile}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="📩 האם תרצה/י שנשלח את הכרטיס שצירפת בקבוצות ווטסאפ יעודיות, כך שיהיו לנו הצעות רבות יותר?">
          <select
            name="shareInWhatsappGroups"
            value={form.shareInWhatsappGroups}
            onChange={handleChange}
          >
            <option>כן</option>
            <option>לא</option>
          </select>
        </QuestionBlock>
        <QuestionBlock label="✅ במידה ויש רעיון להצעה, תרצ/י שנציע קודם לך או לצד השני?">
          <select
            name="proposePreference"
            value={form.proposePreference}
            onChange={handleChange}
          >
            {proposePreferences.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </QuestionBlock>
        <QuestionBlock label="📱 מספר טלפון שלך:">
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            required
          />
        </QuestionBlock>
        <QuestionBlock label="📞 מספרים לבירור (מספר ושם):">
          <>
            {form.referencePhones.map((r, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <input
                  value={r}
                  onChange={(e) => updateArray('referencePhones', idx, e.target.value)}
                />
              </div>
            ))}
            <button
              type="button"
              className={styles.addButton}
              onClick={() => addArrayItem('referencePhones', '')}
            >
              הוסף מספר
            </button>
          </>
        </QuestionBlock>
        <QuestionBlock label="📸 צרפ/י לפחות שתי תמונות שלך (פנים + כל גוף):">
          <input type="file" accept="image/*" multiple onChange={handleImageChange} />
        </QuestionBlock>
        <QuestionBlock label="🪬 אפשר להשאיר שם לתפילה לזיווג הגון ונשתדל להתפלל:">
          <textarea
            name="nameForPrayer"
            value={form.nameForPrayer}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="🖊 אם תרצה/י לכתוב עוד משהו. (איך הגעת אלינו):">
          <textarea
            name="referralSource"
            value={form.referralSource}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <QuestionBlock label="🫡 מה הציפיות שלך מאיתנו (השדכנים):">
          <textarea
            name="matchmakerExpectations"
            value={form.matchmakerExpectations}
            onChange={handleChange}
            rows={3}
          />
        </QuestionBlock>
        <button type="submit">שלח</button>
      </form>
      {matchmaker?.priceRange && (
        <p>
          נ.ב. דמי שידוך בעז"ה בתשלום של {matchmaker.priceRange.min}–
          {matchmaker.priceRange.max} ש"ח
        </p>
      )}
    </div>
  );
};

export default SingleForm;
