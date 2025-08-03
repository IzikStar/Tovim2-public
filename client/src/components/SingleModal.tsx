import { useState } from "react";
import { Single } from "../utils/fakeData";
import styles from "./SingleModal.module.css";

interface Props {
  single: Single;
  onClose: () => void;
}

const questions: { key: keyof Single; text: string }[] = [
  { key: "firstName", text: "😃 שם פרטי:" },
  { key: "lastName", text: "👨‍👩‍👧‍👦 שם משפחה:" },
  { key: "phoneNumber", text: "📱 מספר טלפון שלך:" },
  { key: "email", text: "אימייל" },
  { key: "city", text: "🏠 מקום מגורים:" },
  { key: "gender", text: "👤 מגדר:" },
  { key: "sectors", text: "🫱🏿‍🫲🏻 סגנון דתי:" },
  { key: "birthDate", text: "🎂 גיל:" },
  { key: "height", text: "🌱 גובה:" },
  { key: "marriageStatus", text: "👤 סטטוס:" },
  { key: "numOfChildren", text: "מספר ילדים" },
  { key: "ethnicity", text: "🕍 עדה:" },
  { key: "workAndStudyPlaces", text: "👩‍🏫 מוסדות לימוד ומקומות עבודה:" },
  { key: "currentOccupation", text: "🎓 מה את/ה עושה בחיים כיום:" },
  { key: "basicDescription", text: "📝 ספר/י לנו על עצמך בצורה טכנית:" },
  { key: "freeDescription", text: "🤓 ספר/י לנו על עצמך דברים נוספים:" },
  { key: "interests", text: "🏓 תחומי עניין בולטים שלך:" },
  { key: "otherInterests", text: "תחומי עניין נוספים:" },
  { key: "futureVision", text: "🧑‍🎓 איפה את/ה רואה את עצמך בעתיד:" },
  {
    key: "nonCompromisableAttributes",
    text: "💍 ארבעה דברים קריטיים בבן/בת הזוג:",
  },
  {
    key: "lookingForAttributes",
    text: "🔍 מה עוד תשמח/י שיהיה בבן/ת הזוג:",
  },
  { key: "appearanceMustHave", text: "👀 מה חשוב שיהיה מבחינה חיצונית:" },
  {
    key: "appearanceMustNotHave",
    text: "🚫 מה חשוב שלא יהיה מבחינה חיצונית:",
  },
  {
    key: "generalDealBreakers",
    text: "👎 מה חשוב שלא יהיה בבן/ת הזוג:",
  },
  {
    key: "existingMatchProfile",
    text: "💳 כרטיס שידוכים רגיל:",
  },
  {
    key: "shareInWhatsappGroups",
    text: "📩 האם לשתף בקבוצות ווטסאפ:",
  },
  {
    key: "proposePreference",
    text: "✅ למי להציע קודם:",
  },
  { key: "referencePhones", text: "📞 מספרים לבירור:" },
  { key: "nameForPrayer", text: "🪬 שם לתפילה:" },
  { key: "referralSource", text: "🖊 איך הגעת אלינו:" },
  {
    key: "matchmakerExpectations",
    text: "🫡 מה הציפיות שלך מאיתנו:",
  },
];

const formatValue = (
  key: string,
  value: any,
  single: Single
): string[] | string | null => {
  if (value === undefined || value === null) return null;
  if (key === "sectors") {
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((s) => (s === "אחר/ת" ? single.customSector || s : s));
  }
  if (key === "birthDate") {
    return String(
      new Date().getFullYear() - new Date(value as string).getFullYear()
    );
  }
  if (key === "ethnicity" && value === "אחר/ת") {
    return single.customEthnicity || null;
  }
  if (key === "interests") {
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((i) =>
      i === "אחר/ת" && single.otherInterests?.length
        ? single.otherInterests.join(", ")
        : i
    );
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? "כן" : "לא";
  }
  if (typeof value === "object") {
    if (key === "desiredAgeRange") {
      return `${value.min ?? ""}-${value.max ?? ""}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const gatherDetails = (single: Single) => {
  const lines: string[] = [];
  questions.forEach(({ key, text }) => {
    const value = formatValue(key as string, (single as any)[key], single);
    if (value) {
      if (Array.isArray(value)) {
        lines.push(`${text} ${value.join(", ")}`);
      } else {
        lines.push(`${text} ${value}`);
      }
    }
  });
  single.images.forEach((img, i) => lines.push(`תמונה ${i + 1}: ${img}`));
  return lines.join("\n");
};

const SingleModal: React.FC<Props> = ({ single, onClose }) => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % (single.images.length || 1));
  const prev = () =>
    setIndex(
      (i) => (i - 1 + (single.images.length || 1)) % (single.images.length || 1)
    );

  const copy = () => {
    const text = gatherDetails(single);
    navigator.clipboard.writeText(text);
  };

  const shareWhatsapp = () => {
    const text = gatherDetails(single);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          ×
        </button>
        <div className={styles.carousel}>
          <button
            className={
              single.gender === "זכר"
                ? styles.maleCarouselButton
                : styles.femaleCarouselButton
            }
            onClick={prev}
          >
            ‹
          </button>
          <img src={single.images[index]} alt={single.firstName} />
          <button
            className={
              single.gender === "זכר"
                ? styles.maleCarouselButton
                : styles.femaleCarouselButton
            }
            onClick={next}
          >
            ›
          </button>
        </div>
        <div className={styles.details}>
          {questions.map(({ key, text }) => {
            const value = formatValue(key as string, (single as any)[key], single);
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            return (
              <div key={key} className={styles.field}>
                <p><strong>{text}</strong></p>
                {Array.isArray(value) ? (
                  <ul>
                    {value.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{value}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.actions}>
          <button
            className={
              single.gender === "זכר"
                ? styles.maleCarouselButton
                : styles.femaleCarouselButton
            }
            onClick={copy}
          >
            העתק
          </button>
          <button className={styles.whatsapp} onClick={shareWhatsapp}>
            וואטסאפ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleModal;
