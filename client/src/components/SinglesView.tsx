import React, { useEffect, useState } from "react";
import FilterBar, { FilterState } from "./FilterBar";
import SingleCard from "./SingleCard";
import SingleModal from "./SingleModal";
import { Single, fakeSingles } from "../utils/fakeData";
import { genders } from "../utils/enums";
import styles from "./SinglesView.module.css";

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
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchSingles();
        setSingles([...data, ...fakeSingles]);
        setAllSingles([...data, ...fakeSingles]);
      } catch {
        setSingles(fakeSingles);
        setAllSingles(fakeSingles);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchSingles]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowFilters(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filtered = singles.filter(
    (s) =>
      (!filters.gender || s.gender === filters.gender) &&
      (!filters.sector || s.sectors?.includes(filters.sector)) &&
      (!filters.marriageStatus ||
        s.marriageStatus === filters.marriageStatus) &&
      (!filters.ethnicity || s.ethnicity === filters.ethnicity) &&
      (!filters.interests?.length ||
        filters.interests.some((i) => s.interests?.includes(i))) &&
      (!filters.search ||
        s.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.lastName.toLowerCase().includes(filters.search.toLowerCase()))
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

  if (loading) {
    return (
      <div className={styles.singlesView}>
        {showFilters ? (
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            onClose={() => setShowFilters(false)}
          />
        ) : (
          <button
            className={styles.openFiltersBtn}
            onClick={() => setShowFilters(true)}
          >
            פילטרים
          </button>
        )}
          <div
            className={styles.contentWrapper}
            style={{ paddingTop: showFilters ? (isMobile ? "200px" : undefined) : "100px" }}
          >
          <div className={styles.loadingState}>טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.singlesView}>
      {showFilters ? (
        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
        />
      ) : (
        <button
          className={styles.openFiltersBtn}
          onClick={() => setShowFilters(true)}
        >
          פילטרים
        </button>
      )}

      <div
        className={styles.contentWrapper}
        style={{ paddingTop: showFilters ? (isMobile ? "200px" : undefined) : "100px" }}
      >
        <div className={styles.randomBtnsContainer}>
          <button className={styles.randomBtn} onClick={showRandom}>
            כרטיס רנדומלי
          </button>
          <button className={styles.randomBtn} onClick={showRandomCouple}>
            זוג רנדומלי
          </button>
          <button className={styles.randomBtn} onClick={shuffleSingles}>
            ערבב
          </button>
        </div>

        {highlight && (
          <div className={styles.highlightSection}>
            <div className={styles.singleGrid}>
              <div>
                <SingleCard
                  key={highlight.id}
                  single={highlight}
                  onSelect={(single) => setSelected(single)}
                  onAddToPrivate={addHandler}
                />
              </div>
            </div>
          </div>
        )}

        {couple && (
          <div className={styles.highlightSection}>
            <div className={styles.singleGrid}>
              {couple.map((s) => (
                <div key={s.id}>
                  <SingleCard
                    single={s}
                    onSelect={(single) => setSelected(single)}
                    onAddToPrivate={addHandler}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>לא נמצאו תוצאות</h3>
            <p>נסה לשנות את הפילטרים או לאפס אותם כדי לראות יותר תוצאות</p>
          </div>
        ) : (
          <div className={styles.singlesGrid}>
            {rest.map((s) => (
              <SingleCard
                key={s.id}
                single={s}
                onSelect={(single) => setSelected(single)}
                onAddToPrivate={addHandler}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <SingleModal single={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default SinglesView;
