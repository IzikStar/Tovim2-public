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
      ? new Date().getFullYear() -
        new Date(single.birthDate).getFullYear()
      : undefined;

  const summary = [
    single.city,
    age ? `${age}` : undefined,
    single.sectors?.join(", "),
    single.marriageStatus,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div
      className={single.gender === "זכר" ? styles.maleCard : styles.femaleCard}
      onClick={() => onSelect?.(single)}
    >
      <img
        className={styles.image}
        src={single.images[0]}
        alt={single.firstName}
      />
      <div className={styles.info}>
        <h3 className={styles.name}>
          {single.firstName} {single.lastName}
        </h3>
        {summary && <p className={styles.summary}>{summary}</p>}
        {single.attributes && single.attributes.length > 0 && (
          <p className={styles.summary}>{single.attributes.join(", ")}</p>
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
