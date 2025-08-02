import { Single } from "../utils/fakeData";
import styles from "./SingleCard.module.css";

interface Props {
  single: Single;
  onSelect?: (single: Single) => void;
  onAddToPrivate?: (single: Single) => void;
}

const SingleCard: React.FC<Props> = ({ single, onSelect, onAddToPrivate }) => {
  const age =
    single.birthYear && !isNaN(single.birthYear)
      ? new Date().getFullYear() - single.birthYear
      : undefined;

  const summary = [
    single.city,
    age ? `${age}` : undefined,
    single.sector,
    single.marriageStatus,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className={styles.card} onClick={() => onSelect?.(single)}>
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
          className={styles.addButton}
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
