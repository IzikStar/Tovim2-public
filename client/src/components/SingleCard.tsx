import { Single } from "../utils/fakeData";
import styles from "./SingleCard.module.css";

interface Props {
  single: Single;
  onSelect?: (single: Single) => void;
  onAddToPrivate?: (single: Single) => void;
}

const SingleCard: React.FC<Props> = ({ single, onSelect, onAddToPrivate }) => {
  const age =
    single.birthDate && !isNaN(new Date(single.birthDate).getTime())
      ? new Date().getFullYear() - new Date(single.birthDate).getFullYear()
      : undefined;

  const qa = [
    { q: "שם פרטי", a: single.firstName },
    { q: "שם משפחה", a: single.lastName },
    { q: "סטטוס", a: single.marriageStatus },
    { q: "גיל", a: age ? `${age}` : undefined },
    { q: "גובה", a: single.height ? `${single.height}` : undefined },
    {
      q: "עדה",
      a:
        single.ethnicity === "אחר/ת"
          ? single.customEthnicity
          : single.ethnicity,
    },
    { q: "מקום מגורים", a: single.city },
    {
      q: "סגנון דתי",
      a: single.sectors?.
        map((s) => (s === "אחר/ת" ? single.customSector || s : s))
        .join(", "),
    },
    {
      q: "מוסדות לימוד ועבודה",
      a: single.workAndStudyPlaces?.join(", "),
    },
    { q: "מה עושה כיום", a: single.currentOccupation },
    { q: "תיאור טכני", a: single.basicDescription },
    { q: "דברים נוספים", a: single.freeDescription },
    {
      q: "תחומי עניין",
      a: single.interests?.
        map((i) => (i === "אחר/ת" ? single.otherInterests?.join(", ") : i))
        .join(", "),
    },
    { q: "חזון עתידי", a: single.futureVision },
    {
      q: "לא מתפשר על",
      a: single.nonCompromisableAttributes?.join(", "),
    },
    { q: "מחפש", a: single.lookingForAttributes?.join(", ") },
    { q: "חשוב שיהיה", a: single.appearanceMustHave },
    { q: "חשוב שלא יהיה", a: single.appearanceMustNotHave },
    { q: "דיל ברייקרים", a: single.generalDealBreakers },
    { q: "כרטיס שידוכים", a: single.existingMatchProfile },
    {
      q: "שיתוף בקבוצות",
      a:
        typeof single.shareInWhatsappGroups === "boolean"
          ? single.shareInWhatsappGroups
            ? "כן"
            : "לא"
          : undefined,
    },
    { q: "העדפת הצעה", a: single.proposePreference },
    { q: "טלפון", a: single.phoneNumber },
    { q: "טלפונים לבירור", a: single.referencePhones?.join(", ") },
    { q: "שם לתפילה", a: single.nameForPrayer },
    { q: "מקור הפניה", a: single.referralSource },
    { q: "ציפיות מהשדכן", a: single.matchmakerExpectations },
  ];

  return (
    <div
      className={single.gender === "זכר" ? styles.maleCard : styles.femaleCard}
      onClick={() => onSelect?.(single)}
    >
      {single.images[0] && (
        <img
          className={styles.image}
          src={single.images[0]}
          alt={single.firstName}
        />
      )}
      <div className={styles.info}>
        {qa.map(
          ({ q, a }) =>
            a && (
              <p key={q} className={styles.summary}>
                <strong>{q}:</strong> {a}
              </p>
            )
        )}
      </div>
      {onAddToPrivate && (
        <button
          className={
            single.gender === "זכר"
              ? styles.maleAddButton
              : styles.femaleAddButton
          }
          onClick={(e) => {
            e.stopPropagation();
            onAddToPrivate(single);
          }}
        >
          הוסף למאגר
        </button>
      )}
    </div>
  );
};

export default SingleCard;
