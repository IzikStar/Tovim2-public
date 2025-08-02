import { useEffect, useState } from "react";
import FilterBar, { FilterState } from "../components/FilterBar";
import SingleCard from "../components/SingleCard";
import SingleModal from "../components/SingleModal";
import { Single, fakeSingles } from "../utils/fakeData";
import apiService from "../services/api";
import { genders } from "../utils/enums";

const Public: React.FC = () => {
  const [singles, setSingles] = useState<Single[]>([]);
  const [allSingles, setAllSingles] = useState<Single[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [selected, setSelected] = useState<Single | null>(null);
  const [couple, setCouple] = useState<[Single, Single] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getPublicSingles();
        setSingles(data);
        setAllSingles(data);
      } catch {
        setSingles(fakeSingles);
        setAllSingles(fakeSingles);
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
        filters.interests.some((i) => s.interests?.includes(i)))
  );

  const addToPrivate = async (single: Single) => {
    try {
      await apiService.addToPrivate(single);
    } catch (e) {
      console.error(e);
    }
  };

  const showRandomCouple = () => {
    const males = filtered.filter((s) => s.gender === genders[0] || s.gender === "זכר");
    const females = filtered.filter((s) => s.gender === genders[1] || s.gender === "נקבה");
    if (males.length === 0 || females.length === 0) return;
    const male = males[Math.floor(Math.random() * males.length)];
    const female = females[Math.floor(Math.random() * females.length)];
    setCouple([male, female]);
  };

  const shuffleSingles = () => {
    setSingles((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCouple(null);
  };

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setSingles(allSingles);
    setCouple(null);
  };

  const rest = filtered.filter((s) =>
    couple ? !couple.some((c) => c.id === s.id) : true
  );

  return (
    <div>
      <FilterBar filters={filters} onChange={handleFiltersChange} />
      <button className="random-btn" onClick={showRandomCouple}>זוג רנדומלי</button>
      <button className="random-btn" onClick={shuffleSingles}>ערבב</button>
      <div className="singles-grid">
        {couple && (
          <>
            {couple.map((s) => (
              <SingleCard
                key={s.id}
                single={s}
                onSelect={(single) => setSelected(single)}
                onAddToPrivate={addToPrivate}
              />
            ))}
            <div className="grid-break" />
          </>
        )}
        {rest.map((s) => (
          <SingleCard
            key={s.id}
            single={s}
            onSelect={(single) => setSelected(single)}
            onAddToPrivate={addToPrivate}
          />
        ))}
      </div>
      {selected && (
        <SingleModal single={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default Public;

