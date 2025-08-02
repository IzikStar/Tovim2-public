import { useState } from "react";
import { Single } from "../utils/fakeData";
import styles from "./SingleModal.module.css";

interface Props {
  single: Single;
  onClose: () => void;
}

const fieldLabels: Record<string, string> = {
  firstName: "שם פרטי",
  lastName: "שם משפחה",
  phoneNumber: "טלפון",
  email: "אימייל",
  city: "עיר",
  gender: "מגדר",
  sector: "מגזר",
  birthYear: "שנת לידה",
  marriageStatus: "מצב משפחתי",
  numOfChildren: "מספר ילדים",
  ethnicity: "עדה",
  workAndStudyPlaces: "מקומות לימוד ועבודה",
  currentOccupation: "עיסוק נוכחי",
  basicDescription: "תיאור בסיסי",
  freeDescription: "תיאור חופשי",
  attributes: "תכונות",
  lookingForAttributes: "תכונות מבוקשות",
  nonCompromisableAttributes: "תכונות לא מתפשר עליהן",
  desiredSectors: "מגזרים רצויים",
  matchMakers: "שדכנים",
  height: "גובה",
  appearanceDescription: "תיאור מראה",
  appearanceMustHave: "חייב במראה",
  appearanceMustNotHave: "אסור במראה",
  generalDealBreakers: "קווים אדומים",
  interests: "תחומי עניין",
  futureVision: "חזון עתידי",
  existingMatchProfile: "פרופיל קיים",
  shareInWhatsappGroups: "שיתוף בקבוצות וואטסאפ",
  proposePreference: "העדפת הצעה",
  referencePhones: "טלפונים להפניות",
  nameForPrayer: "שם לתפילה",
  referralSource: "מקור הפניה",
  matchmakerExpectations: "ציפיות מהשדכן",
  desiredAgeRange: "טווח גיל רצוי",
  searchText: "טקסט חיפוש",
};

const formatValue = (key: string, value: any, single: Single): string | null => {
  if (value === undefined || value === null) return null;
  if (key === "sector" && value === "אחר/ת") {
    return single.customSector || null;
  }
  if (key === "ethnicity" && value === "אחר/ת") {
    return single.customEthnicity || null;
  }
  if (key === "interests") {
    const arr = Array.isArray(value) ? value : [value];
    return arr
      .map((i) =>
        i === "אחר/ת" && single.otherInterests?.length
          ? single.otherInterests.join(", ")
          : i
      )
      .join(", ");
  }
  if (Array.isArray(value)) {
    return value.join(", ");
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
  Object.entries(fieldLabels).forEach(([key, label]) => {
    const value = formatValue(key, (single as any)[key], single);
    if (value) {
      lines.push(`${label}: ${value}`);
    }
  });
  single.images.forEach((img, i) =>
    lines.push(`תמונה ${i + 1}: ${img}`)
  );
  return lines.join("\n");
};

const SingleModal: React.FC<Props> = ({ single, onClose }) => {
  const [index, setIndex] = useState(0);

  const next = () =>
    setIndex((i) => (i + 1) % (single.images.length || 1));
  const prev = () =>
    setIndex((i) => (i - 1 + (single.images.length || 1)) % (single.images.length || 1));

  const copy = () => {
    const text = gatherDetails(single);
    navigator.clipboard.writeText(text);
  };

  const shareWhatsapp = () => {
    const text = gatherDetails(single);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          ×
        </button>
        <div className={styles.carousel}>
          <button onClick={prev}>‹</button>
          <img src={single.images[index]} alt={single.firstName} />
          <button onClick={next}>›</button>
        </div>
        <div className={styles.details}>
          {Object.entries(fieldLabels).map(([key, label]) => {
            const value = formatValue(key, (single as any)[key], single);
            if (!value) return null;
            return (
              <p key={key}>
                <strong>{label}:</strong> {value}
              </p>
            );
          })}
        </div>
        <div className={styles.actions}>
          <button onClick={copy}>העתק</button>
          <button className={styles.whatsapp} onClick={shareWhatsapp}>
            וואטסאפ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleModal;

