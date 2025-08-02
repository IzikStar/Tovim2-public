import { Single } from '../utils/fakeData';
import styles from './SingleCard.module.css';

interface Props {
  single: Single;
}

const SingleCard: React.FC<Props> = ({ single }) => {
  const sendWhatsapp = () => {
    const text = `כרטיס של ${single.firstName} ${single.lastName} ${single.image}`;
    const url = `https://api.whatsapp.com/send?phone=${single.phoneNumber}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={styles.card}>
      <img className={styles.image} src={single.image} alt={single.firstName} />
      <div className={styles.info}>
        <h3 className={styles.name}>
          {single.firstName} {single.lastName}
        </h3>
        <ul className={styles.details}>
          <li><strong>מין:</strong> {single.gender}</li>
          <li><strong>מגזר:</strong> {single.sector}</li>
          <li><strong>מצב משפחתי:</strong> {single.marriageStatus}</li>
          <li><strong>עדה:</strong> {single.ethnicity}</li>
          <li><strong>תחומי עניין:</strong> {single.interests.join(', ')}</li>
          <li><strong>העדפת הצעה:</strong> {single.proposePreference}</li>
          <li><strong>טלפון:</strong> {single.phoneNumber}</li>
        </ul>
        <button className={styles.whatsappButton} onClick={sendWhatsapp}>
          שלח בוואטסאפ
        </button>
      </div>
    </div>
  );
};

export default SingleCard;
