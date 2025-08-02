import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import FilterBar, { FilterState } from '../components/FilterBar';
import SingleCard from '../components/SingleCard';
import { fakeSingles, Single } from '../utils/fakeData';
import apiService from '../services/api';

const Dashboard: React.FC = () => {
  const [singles, setSingles] = useState<Single[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [highlight, setHighlight] = useState<Single | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getPublicSingles();
        setSingles([...data, ...fakeSingles]);
      } catch {
        setSingles(fakeSingles);
      }
    };
    load();
  }, []);

  const filtered = singles.filter((s) =>
    (!filters.gender || s.gender === filters.gender) &&
    (!filters.sector || s.sector === filters.sector) &&
    (!filters.marriageStatus || s.marriageStatus === filters.marriageStatus) &&
    (!filters.ethnicity || s.ethnicity === filters.ethnicity) &&
    (!filters.interest || s.interests.includes(filters.interest)) &&
    (!filters.proposePreference || s.proposePreference === filters.proposePreference)
  );

  const showRandom = () => {
    if (filtered.length === 0) return;
    const rand = filtered[Math.floor(Math.random() * filtered.length)];
    setHighlight(rand);
  };

  const list = highlight
    ? [highlight, ...filtered.filter((s) => s.id !== highlight.id)]
    : filtered;

  return (
    <div>
      <Navbar />
      <FilterBar filters={filters} onChange={setFilters} />
      <button onClick={showRandom}>כרטיס רנדומלי</button>
      <div style={{ marginTop: '1rem' }}>
        {list.map((s) => (
          <SingleCard key={s.id} single={s} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
