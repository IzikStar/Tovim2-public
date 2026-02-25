import React, { useState } from "react";
import {
  genders,
  sectors,
  marriageStatuses,
  ethnicities,
  interests,
} from "../utils/enums";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";

export interface FilterState {
  gender?: string;
  sector?: string;
  marriageStatus?: string;
  ethnicity?: string;
  interests?: string[];
  search?: string;
  showTaken?: boolean;
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

const FilterBar: React.FC<Props> = ({ filters, onChange, onClose }) => {
  const [showInterests, setShowInterests] = useState(false);

  const handleReset = () => {
    onChange({});
    setShowInterests(false);
    onClose?.();
  };

  const handleClose = () => {
    setShowInterests(false);
    onClose?.();
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-md backdrop-blur md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground md:text-base">פילטרים</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={handleClose}>
            סגור
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="search">חיפוש שם</Label>
          <Input
            id="search"
            value={filters.search || ""}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value || undefined })
            }
            placeholder="שם פרטי או משפחה"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">מין</Label>
          <Select
            id="gender"
            value={filters.gender || ""}
            onChange={makeHandler("gender", filters, onChange)}
          >
            <option value="">כל המינים</option>
            {genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">מגזר</Label>
          <Select
            id="sector"
            value={filters.sector || ""}
            onChange={makeHandler("sector", filters, onChange)}
          >
            <option value="">כל המגזרים</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marriage-status">מצב משפחתי</Label>
          <Select
            id="marriage-status"
            value={filters.marriageStatus || ""}
            onChange={makeHandler("marriageStatus", filters, onChange)}
          >
            <option value="">כל המצבים</option>
            {marriageStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ethnicity">עדה</Label>
          <Select
            id="ethnicity"
            value={filters.ethnicity || ""}
            onChange={makeHandler("ethnicity", filters, onChange)}
          >
            <option value="">כל העדות</option>
            {ethnicities.map((ethnicity) => (
              <option key={ethnicity} value={ethnicity}>
                {ethnicity}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taken">תפוס</Label>
          <Select
            id="taken"
            value={filters.showTaken ? "all" : "available"}
            onChange={(e) =>
              onChange({
                ...filters,
                showTaken: e.target.value === "all" ? true : undefined,
              })
            }
          >
            <option value="available">פנויים בלבד</option>
            <option value="all">כולל תפוסים</option>
          </Select>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-muted/45 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Label>תחומי עניין</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInterests((prev) => !prev)}
          >
            {showInterests ? "הסתר" : "בחר תחומים"}
          </Button>
        </div>

        {showInterests && (
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border/60 bg-card p-2 sm:grid-cols-3 md:grid-cols-4">
            {interests.map((interest) => (
              <label
                key={interest}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={filters.interests?.includes(interest) || false}
                  onChange={toggleInterest(interest, filters, onChange)}
                />
                <span className="truncate">{interest}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={handleReset}>
          איפוס
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
