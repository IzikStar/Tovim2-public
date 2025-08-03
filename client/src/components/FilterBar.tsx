import React from "react";
import {
  genders,
  sectors,
  marriageStatuses,
  ethnicities,
  interests,
} from "../utils/enums";
import styles from "./FilterBar.module.css";

export interface FilterState {
  gender?: string;
  sector?: string;
  marriageStatus?: string;
  ethnicity?: string;
  interests?: string[];
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose?: () => void;
}

const makeHandler =
  (
    key: keyof FilterState,
    filters: FilterState,
    onChange: (f: FilterState) => void
  ) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    onChange({ ...filters, [key]: value });
  };

const toggleInterest =
  (
    interest: string,
    filters: FilterState,
    onChange: (f: FilterState) => void
  ) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const current = new Set(filters.interests || []);
    if (e.target.checked) current.add(interest);
    else current.delete(interest);
    const arr = Array.from(current);
    onChange({ ...filters, interests: arr.length ? arr : undefined });
  };

const resetFilters = (onChange: (f: FilterState) => void) => () => onChange({});

const FilterBar: React.FC<Props> = ({ filters, onChange, onClose }) => (
  <div className={styles.filterBar}>
    {onClose && (
      <button className={styles.closeBtn} onClick={onClose}>
        ✕
      </button>
    )}
    <div className={styles.filterItem}>
      <label>מין</label>
      <select
        value={filters.gender || ""}
        onChange={makeHandler("gender", filters, onChange)}
      >
        <option value="">כל המינים</option>
        {genders.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </div>

    <div className={styles.filterItem}>
      <label>מגזר</label>
      <select
        value={filters.sector || ""}
        onChange={makeHandler("sector", filters, onChange)}
      >
        <option value="">כל המגזרים</option>
        {sectors.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>

    <div className={styles.filterItem}>
      <label>מצב משפחתי</label>
      <select
        value={filters.marriageStatus || ""}
        onChange={makeHandler("marriageStatus", filters, onChange)}
      >
        <option value="">כל המצבים</option>
        {marriageStatuses.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>

    <div className={styles.filterItem}>
      <label>עדה</label>
      <select
        value={filters.ethnicity || ""}
        onChange={makeHandler("ethnicity", filters, onChange)}
      >
        <option value="">כל העדות</option>
        {ethnicities.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
    </div>

    <div className={styles.filterItem}>
      <label>תחומי עניין</label>
      <details className={styles.interestsCollapse}>
        <summary>בחר תחומי עניין</summary>
        <div className={styles.interestsGroup}>
          {interests.map((i) => (
            <label key={i} className={styles.interestLabel}>
              <input
                type="checkbox"
                className={styles.interestCheckbox}
                checked={filters.interests?.includes(i) || false}
                onChange={toggleInterest(i, filters, onChange)}
              />
              {i}
            </label>
          ))}
        </div>
      </details>
    </div>

    <button
      type="button"
      className={styles.resetBtn}
      onClick={resetFilters(onChange)}
    >
      איפוס
    </button>
  </div>
);

export default FilterBar;
