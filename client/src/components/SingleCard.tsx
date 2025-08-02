import { Single } from '../utils/fakeData';

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
    <div style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
      <img src={single.image} alt={single.firstName} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
      <div>{single.firstName} {single.lastName}</div>
      <button onClick={sendWhatsapp}>שלח בוואטסאפ</button>
    </div>
  );
};

export default SingleCard;
