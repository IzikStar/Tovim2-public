import { useState } from "react";
import { Single } from "../utils/fakeData";
import styles from "./SingleModal.module.css";

interface Props {
  single: Single;
  onClose: () => void;
}

const SingleModal: React.FC<Props> = ({ single, onClose }) => {
  const [index, setIndex] = useState(0);

  const next = () =>
    setIndex((i) => (i + 1) % (single.images.length || 1));
  const prev = () =>
    setIndex((i) => (i - 1 + (single.images.length || 1)) % (single.images.length || 1));

  const copy = () => {
    const text = `${single.firstName} ${single.lastName} - ${single.phoneNumber}`;
    navigator.clipboard.writeText(text);
  };

  const shareWhatsapp = () => {
    const text = `${single.firstName} ${single.lastName}`;
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
          <p>
            <strong>מגזר:</strong> {single.sector}
          </p>
          <p>
            <strong>מצב משפחתי:</strong> {single.marriageStatus}
          </p>
          <p>
            <strong>עדה:</strong> {single.ethnicity}
          </p>
          <p>
            <strong>תחומי עניין:</strong> {single.interests.join(", ")}
          </p>
          <p>
            <strong>העדפת הצעה:</strong> {single.proposePreference}
          </p>
          <p>
            <strong>טלפון:</strong> {single.phoneNumber}
          </p>
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

