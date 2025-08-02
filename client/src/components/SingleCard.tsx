import { Single } from "../utils/fakeData";
import styles from "./SingleCard.module.css";

interface Props {
  single: Single;
  onSelect?: (single: Single) => void;
  onAddToPrivate?: (single: Single) => void;
}

const SingleCard: React.FC<Props> = ({ single, onSelect, onAddToPrivate }) => {
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
        <p className={styles.summary}>
          {single.sector} • {single.ethnicity}
        </p>
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
