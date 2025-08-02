import React, { useMemo, useState } from 'react';
import SingleCard, { Single } from '../components/SingleCard';

const publicSingles: Single[] = [
  {
    id: 'p1',
    name: 'Sara',
    age: 24,
    gender: 'female',
    image: 'https://via.placeholder.com/150',
    details: 'Teacher and volunteer'
  },
  {
    id: 'p2',
    name: 'Moshe',
    age: 29,
    gender: 'male',
    image: 'https://via.placeholder.com/150',
    details: 'Engineer who likes chess'
  }
];

const PublicDatabase: React.FC = () => {
  const [search, setSearch] = useState('');
  const [singles, setSingles] = useState<Single[]>(publicSingles);

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

  return (
    <div style={{ padding: '1rem' }}>
      <h2>מאגר ציבורי</h2>
      <div>
        <input
          placeholder="חיפוש..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={shuffle}>ערבוב</button>
      </div>
      <div>
        {filtered.map(s => (
          <SingleCard key={s.id} single={s} />
        ))}
      </div>
    </div>
  );
};

export default PublicDatabase;
