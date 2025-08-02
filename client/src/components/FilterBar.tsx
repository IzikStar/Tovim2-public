import { genders, sectors, marriageStatuses, ethnicities, interests, proposePreferences } from '../utils/enums';

export interface FilterState {
  gender?: string;
  sector?: string;
  marriageStatus?: string;
  ethnicity?: string;
  interest?: string;
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

const FilterBar: React.FC<Props> = ({ filters, onChange }) => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
    <select value={filters.gender || ''} onChange={makeHandler('gender', filters, onChange)}>
      <option value=''>כל המינים</option>
      {genders.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
    <select value={filters.sector || ''} onChange={makeHandler('sector', filters, onChange)}>
      <option value=''>כל המגזרים</option>
      {sectors.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
    <select value={filters.marriageStatus || ''} onChange={makeHandler('marriageStatus', filters, onChange)}>
      <option value=''>כל המצבים</option>
      {marriageStatuses.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
    <select value={filters.ethnicity || ''} onChange={makeHandler('ethnicity', filters, onChange)}>
      <option value=''>כל העדות</option>
      {ethnicities.map((e) => (
        <option key={e} value={e}>{e}</option>
      ))}
    </select>
    <select value={filters.interest || ''} onChange={makeHandler('interest', filters, onChange)}>
      <option value=''>כל התחביבים</option>
      {interests.map((i) => (
        <option key={i} value={i}>{i}</option>
      ))}
    </select>
    <select value={filters.proposePreference || ''} onChange={makeHandler('proposePreference', filters, onChange)}>
      <option value=''>כל ההעדפות</option>
      {proposePreferences.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>
);

export default FilterBar;
