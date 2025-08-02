import { useEffect, useState } from "react";
import FilterBar, { FilterState } from "./FilterBar";
import SingleCard from "./SingleCard";
import SingleModal from "./SingleModal";
import { Single, fakeSingles } from "../utils/fakeData";
import { genders } from "../utils/enums";

interface Props {
  fetchSingles: () => Promise<Single[]>;
  onAddToPrivate?: (single: Single) => Promise<void>;
}

const SinglesView: React.FC<Props> = ({ fetchSingles, onAddToPrivate }) => {
  const [singles, setSingles] = useState<Single[]>([]);
  const [allSingles, setAllSingles] = useState<Single[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [highlight, setHighlight] = useState<Single | null>(null);
  const [couple, setCouple] = useState<[Single, Single] | null>(null);
  const [selected, setSelected] = useState<Single | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSingles();
        setSingles([...data, ...fakeSingles]);
        setAllSingles([...data, ...fakeSingles]);
      } catch {
        setSingles(fakeSingles);
        setAllSingles(fakeSingles);
      }
    };
    load();
  }, [fetchSingles]);

  const filtered = singles.filter(
    (s) =>
      (!filters.gender || s.gender === filters.gender) &&
      (!filters.sector || s.sector === filters.sector) &&
      (!filters.marriageStatus ||
        s.marriageStatus === filters.marriageStatus) &&
      (!filters.ethnicity || s.ethnicity === filters.ethnicity) &&
      (!filters.interests?.length ||
        filters.interests.some((i) => s.interests?.includes(i)))
  );

  const showRandom = () => {
    if (filtered.length === 0) return;
    const rand = filtered[Math.floor(Math.random() * filtered.length)];
    setHighlight(rand);
    setCouple(null);
  };

  const showRandomCouple = () => {
    const males = filtered.filter(
      (s) => s.gender === genders[0] || s.gender === "זכר"
    );
    const females = filtered.filter(
      (s) => s.gender === genders[1] || s.gender === "נקבה"
    );
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

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setSingles(allSingles);
    setHighlight(null);
    setCouple(null);
  };

  const rest = filtered.filter((s) => {
    if (highlight) return s.id !== highlight.id;
    if (couple) return !couple.some((c) => c.id === s.id);
    return true;
  });

  const addHandler = onAddToPrivate
    ? async (single: Single) => {
        try {
          await onAddToPrivate(single);
        } catch (e) {
          console.error(e);
        }
      }
    : undefined;

  return (
    <div>
      <FilterBar filters={filters} onChange={handleFiltersChange} />
      <div className="random-btns-container">
        <button className="random-btn" onClick={showRandom}>
          כרטיס רנדומלי
        </button>
        <button className="random-btn" onClick={showRandomCouple}>
          זוג רנדומלי
        </button>
        <button className="random-btn" onClick={shuffleSingles}>
          ערבב
        </button>
      </div>
      <div className="singles-grid">
        {highlight && (
          <>
            <SingleCard
              key={highlight.id}
              single={highlight}
              onSelect={(single) => setSelected(single)}
              onAddToPrivate={addHandler}
            />
            <div className="grid-break" />
          </>
        )}
        {couple && (
          <>
            {couple.map((s) => (
              <SingleCard
                key={s.id}
                single={s}
                onSelect={(single) => setSelected(single)}
                onAddToPrivate={addHandler}
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
            onAddToPrivate={addHandler}
          />
        ))}
      </div>
      {selected && (
        <SingleModal single={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default SinglesView;
