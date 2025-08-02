import { useEffect, useState } from "react";
import FilterBar, { FilterState } from "../components/FilterBar";
import SingleCard from "../components/SingleCard";
import SingleModal from "../components/SingleModal";
import { fakeSingles, Single } from "../utils/fakeData";
import apiService from "../services/api";
import { genders } from "../utils/enums";

const Dashboard: React.FC = () => {
  const [singles, setSingles] = useState<Single[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [highlight, setHighlight] = useState<Single | null>(null);
  const [couple, setCouple] = useState<[Single, Single] | null>(null);
  const [selected, setSelected] = useState<Single | null>(null);

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

  const filtered = singles.filter(
    (s) =>
      (!filters.gender || s.gender === filters.gender) &&
      (!filters.sector || s.sector === filters.sector) &&
      (!filters.marriageStatus || s.marriageStatus === filters.marriageStatus) &&
      (!filters.ethnicity || s.ethnicity === filters.ethnicity) &&
      (!filters.interests?.length ||
        filters.interests.some((i) => s.interests?.includes(i))) &&
      (!filters.proposePreference || s.proposePreference === filters.proposePreference)
  );

  const showRandom = () => {
    if (filtered.length === 0) return;
    const rand = filtered[Math.floor(Math.random() * filtered.length)];
    setHighlight(rand);
    setCouple(null);
  };

  const showRandomCouple = () => {
    const males = filtered.filter((s) => s.gender === genders[0] || s.gender === "זכר");
    const females = filtered.filter((s) => s.gender === genders[1] || s.gender === "נקבה");
    if (males.length === 0 || females.length === 0) return;
    const male = males[Math.floor(Math.random() * males.length)];
    const female = females[Math.floor(Math.random() * females.length)];
    setCouple([male, female]);
    setHighlight(null);
  };

  const shuffleSingles = () => {
    setSingles((prev) => [...prev].sort(() => Math.random() - 0.5));
    setHighlight(null);
    setCouple(null);
  };

  const rest = filtered.filter((s) => {
    if (highlight) return s.id !== highlight.id;
    if (couple) return !couple.some((c) => c.id === s.id);
    return true;
  });

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <button className="random-btn" onClick={showRandom}>כרטיס רנדומלי</button>
      <button className="random-btn" onClick={showRandomCouple}>זוג רנדומלי</button>
      <button className="random-btn" onClick={shuffleSingles}>ערבב</button>
      <div className="singles-grid">
        {highlight && (
          <>
            <SingleCard
              key={highlight.id}
              single={highlight}
              onSelect={(single) => setSelected(single)}
            />
            <div className="grid-break" />
          </>
        )}
        {couple && (
          <>
            {couple.map((s) => (
              <SingleCard key={s.id} single={s} onSelect={(single) => setSelected(single)} />
            ))}
            <div className="grid-break" />
          </>
        )}
        {rest.map((s) => (
          <SingleCard key={s.id} single={s} onSelect={(single) => setSelected(single)} />
        ))}
      </div>
      {selected && (
        <SingleModal single={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default Dashboard;
