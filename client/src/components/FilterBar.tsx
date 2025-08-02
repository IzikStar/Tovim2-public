import { genders, sectors, marriageStatuses, ethnicities, interests, proposePreferences } from '../utils/enums';

export interface FilterState {
  gender?: string;
  sector?: string;
  marriageStatus?: string;
  ethnicity?: string;
  interests?: string[];
  proposePreference?: string;
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const makeHandler = (
  key: keyof FilterState,
  filters: FilterState,
  onChange: (f: FilterState) => void
) => (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = e.target.value || undefined;
  onChange({ ...filters, [key]: value });
};

const handleInterests = (
  filters: FilterState,
  onChange: (f: FilterState) => void
) => (e: React.ChangeEvent<HTMLSelectElement>) => {
  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
  onChange({ ...filters, interests: selected.length ? selected : undefined });
};

const resetFilters = (onChange: (f: FilterState) => void) => () => onChange({});

const FilterBar: React.FC<Props> = ({ filters, onChange }) => (
  <div className="filter-bar">
    <div className="filter-item">
      <label>מין</label>
      <select value={filters.gender || ''} onChange={makeHandler('gender', filters, onChange)}>
        <option value=''>כל המינים</option>
        {genders.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
    </div>
    <div className="filter-item">
      <label>מגזר</label>
      <select value={filters.sector || ''} onChange={makeHandler('sector', filters, onChange)}>
        <option value=''>כל המגזרים</option>
        {sectors.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
    <div className="filter-item">
      <label>מצב משפחתי</label>
      <select value={filters.marriageStatus || ''} onChange={makeHandler('marriageStatus', filters, onChange)}>
        <option value=''>כל המצבים</option>
        {marriageStatuses.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
    <div className="filter-item">
      <label>עדה</label>
      <select value={filters.ethnicity || ''} onChange={makeHandler('ethnicity', filters, onChange)}>
        <option value=''>כל העדות</option>
        {ethnicities.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>
    </div>
    <div className="filter-item">
      <label>תחומי עניין</label>
      <select multiple value={filters.interests || []} onChange={handleInterests(filters, onChange)} size={3}>
        {interests.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
    </div>
    <div className="filter-item">
      <label>העדפת הצעה</label>
      <select value={filters.proposePreference || ''} onChange={makeHandler('proposePreference', filters, onChange)}>
        <option value=''>כל ההעדפות</option>
        {proposePreferences.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
    <button type="button" className="reset-btn" onClick={resetFilters(onChange)}>איפוס</button>
  </div>
);

export default FilterBar;
