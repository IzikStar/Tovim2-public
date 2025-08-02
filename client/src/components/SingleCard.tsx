import React, { useState } from 'react';

export interface Single {
  id: string;
  name: string;
  age: number;
  gender: string;
  image: string;
  details: string;
}

interface Props {
  single: Single;
}

const SingleCard: React.FC<Props> = ({ single }) => {
  const [open, setOpen] = useState(false);

  const copyCard = () => {
    const text = `${single.name}, ${single.age}, ${single.gender} - ${single.details}`;
    navigator.clipboard.writeText(text);
  };

  const whatsapp = () => {
    const text = encodeURIComponent(`${single.name}, ${single.age}, ${single.gender} - ${single.details}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={{ border: '1px solid #ccc', margin: '0.5rem', padding: '0.5rem' }}>
      <img src={single.image} alt={single.name} width={100} height={100} />
      <div>
        <strong>{single.name}</strong> ({single.age})
      </div>
      <div>{single.gender}</div>
      {open && <div>{single.details}</div>}
      <button onClick={() => setOpen(o => !o)}>{open ? 'סגור' : 'הרחב'}</button>
      <button onClick={copyCard}>העתקה</button>
      <button onClick={whatsapp}>שליחה בוואטסאפ</button>
    </div>
  );
};

export default SingleCard;
