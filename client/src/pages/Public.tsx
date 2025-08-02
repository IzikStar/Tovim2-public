import { useEffect, useState } from "react";
import FilterBar, { FilterState } from "../components/FilterBar";
import SingleCard from "../components/SingleCard";
import SingleModal from "../components/SingleModal";
import { Single, fakeSingles } from "../utils/fakeData";
import apiService from "../services/api";

const Public: React.FC = () => {
  const [singles, setSingles] = useState<Single[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [selected, setSelected] = useState<Single | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getPublicSingles();
        setSingles(data);
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
      (!filters.interest || s.interests.includes(filters.interest)) &&
      (!filters.proposePreference || s.proposePreference === filters.proposePreference)
  );

  const addToPrivate = async (single: Single) => {
    try {
      await apiService.addToPrivate(single);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="singles-grid">
        {filtered.map((s) => (
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

