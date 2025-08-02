import React, { useMemo, useState } from 'react';
import SingleCard, { Single } from '../components/SingleCard';

interface Props {
  matchmakerId: string;
}

const sampleSingles: Single[] = [
  {
    id: '1',
    name: 'Leah',
    age: 25,
    gender: 'female',
    image: 'https://via.placeholder.com/150',
    details: 'Loves hiking and books'
  },
  {
    id: '2',
    name: 'David',
    age: 27,
    gender: 'male',
    image: 'https://via.placeholder.com/150',
    details: 'Enjoys music and travel'
  },
  {
    id: '3',
    name: 'Rachel',
    age: 23,
    gender: 'female',
    image: 'https://via.placeholder.com/150',
    details: 'Artist and designer'
  }
];

const MatchmakerDashboard: React.FC<Props> = ({ matchmakerId }) => {
  const [search, setSearch] = useState('');
  const [singles, setSingles] = useState<Single[]>(sampleSingles);

  const filtered = useMemo(
    () =>
      singles.filter(s =>
        `${s.name} ${s.details}`.toLowerCase().includes(search.toLowerCase())
      ),
    [singles, search]
  );

  const shuffle = () => {
    setSingles(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const randomSingle = () => {
    const s = singles[Math.floor(Math.random() * singles.length)];
    alert(`Random: ${s.name}`);
  };

  const randomPair = () => {
    const males = singles.filter(s => s.gender === 'male');
    const females = singles.filter(s => s.gender === 'female');
    if (males.length && females.length) {
      const m = males[Math.floor(Math.random() * males.length)];
      const f = females[Math.floor(Math.random() * females.length)];
      alert(`Pair: ${m.name} & ${f.name}`);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>מאגר לשדכן {matchmakerId}</h2>
      <div>
        <input
          placeholder="חיפוש..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={shuffle}>ערבוב</button>
        <button onClick={randomSingle}>הקפצה רנדומלית</button>
        <button onClick={randomPair}>זוג רנדומלי</button>
      </div>
      <div>
        {filtered.map(s => (
          <SingleCard key={s.id} single={s} />
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => (window.location.href = '/public')}>מאגר ציבורי</button>
      </div>
    </div>
  );
};

export default MatchmakerDashboard;
