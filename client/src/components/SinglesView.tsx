import React, { useEffect, useState } from "react";
import { Shuffle, Sparkles, UsersRound } from "lucide-react";
import FilterBar, { FilterState } from "./FilterBar";
import SingleCard from "./SingleCard";
import SingleModal from "./SingleModal";
import { Single } from "../utils/types";
import { genders } from "../utils/enums";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchSingles();
      setSingles(data);
      setAllSingles(data);
    } catch {
      setSingles([]);
      setAllSingles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      (!filters.marriageStatus || s.marriageStatus === filters.marriageStatus) &&
      (!filters.ethnicity || s.ethnicity === filters.ethnicity) &&
      (!filters.interests?.length ||
        filters.interests.some((interest) => s.interests?.includes(interest))) &&
      (!filters.search ||
        s.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.lastName.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.showTaken || !s.isTaken)
  );

  const showRandom = () => {
    if (!filtered.length) return;
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    setHighlight(random);
    setCouple(null);
  };

  const showRandomCouple = () => {
    const males = filtered.filter((s) => s.gender === genders[0] || s.gender === "זכר");
    const females = filtered.filter(
      (s) => s.gender === genders[1] || s.gender === "נקבה"
    );
    if (!males.length || !females.length) return;

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

  const handleFiltersChange = (nextFilters: FilterState) => {
    setFilters(nextFilters);
    setSingles(allSingles);
    setHighlight(null);
    setCouple(null);
  };

  const rest = filtered.filter((single) => {
    if (highlight) return single.id !== highlight.id;
    if (couple) return !couple.some((chosen) => chosen.id === single.id);
    return true;
  });

  const addHandler = onAddToPrivate
    ? async (single: Single) => {
        try {
          await onAddToPrivate(single);
        } catch (error) {
          console.error(error);
        }
      }
    : undefined;

  return (
    <div className="page-shell">
      <section className="mb-4 space-y-3">
        {showFilters ? (
          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            onClose={isMobile ? () => setShowFilters(false) : undefined}
          />
        ) : (
          <Button variant="outline" onClick={() => setShowFilters(true)}>
            פתח פילטרים
          </Button>
        )}
      </section>

      <section className="mb-5 flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <Button variant="secondary" className="gap-2" onClick={showRandom}>
          <Sparkles className="h-4 w-4" />
          כרטיס רנדומלי
        </Button>
        <Button variant="accent" className="gap-2" onClick={showRandomCouple}>
          <UsersRound className="h-4 w-4" />
          זוג רנדומלי
        </Button>
        <Button variant="outline" className="gap-2" onClick={shuffleSingles}>
          <Shuffle className="h-4 w-4" />
          ערבב
        </Button>
      </section>

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>טוען נתונים</CardTitle>
            <CardDescription>עוד רגע הרשימה תופיע</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {highlight && (
            <section className="mb-6">
              <h3 className="mb-3 text-lg font-bold text-primary">נבחר אקראי</h3>
              <div className="mx-auto max-w-sm">
                <SingleCard
                  key={highlight.id}
                  single={highlight}
                  onSelect={(single) => setSelected(single)}
                  onAddToPrivate={addHandler}
                />
              </div>
            </section>
          )}

          {couple && (
            <section className="mb-6">
              <h3 className="mb-3 text-lg font-bold text-primary">הצעת זוג</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {couple.map((single) => (
                  <SingleCard
                    key={single.id}
                    single={single}
                    onSelect={(item) => setSelected(item)}
                    onAddToPrivate={addHandler}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 ? (
            <Card className="border-dashed bg-muted/40">
              <CardHeader>
                <CardTitle>לא נמצאו תוצאות</CardTitle>
                <CardDescription>
                  נסה לשנות פילטרים או לבצע איפוס כדי לראות כרטיסים נוספים.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {rest.map((single) => (
                <SingleCard
                  key={single.id}
                  single={single}
                  onSelect={(item) => setSelected(item)}
                  onAddToPrivate={addHandler}
                />
              ))}
            </section>
          )}
        </>
      )}

      {selected && (
        <SingleModal single={selected} onClose={() => setSelected(null)} onRefresh={load} />
      )}
    </div>
  );
};

export default SinglesView;
