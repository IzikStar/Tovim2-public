import { useEffect, useState } from "react";
import apiService, { MatchMaker } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { genders, sectors } from "../utils/enums";
import styles from "./EditProfile.module.css";

const EditProfile: React.FC = () => {
  const { matchMakerId } = useAuth();
  const [form, setForm] = useState<MatchMaker | null>(null);
  const [showSectors, setShowSectors] = useState(false);

  useEffect(() => {
    if (matchMakerId) {
      apiService.getMatchmaker(matchMakerId).then(setForm);
    }
  }, [matchMakerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value } as MatchMaker);
  };

  const toggleSector = (sector: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!form) return;
    const current = new Set(form.expertSectors || []);
    if (e.target.checked) current.add(sector);
    else current.delete(sector);
    setForm({ ...form, expertSectors: Array.from(current) });
  };

  const handleAgeRange = (field: "min" | "max") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!form) return;
    const val = e.target.value ? Number(e.target.value) : undefined;
    setForm({ ...form, ageRange: { ...form.ageRange, [field]: val } });
  };

  const handlePriceRange = (field: "min" | "max") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!form) return;
    const val = e.target.value ? Number(e.target.value) : undefined;
    setForm({ ...form, priceRange: { ...form.priceRange, [field]: val } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchMakerId || !form) return;
    await apiService.updateMatchmaker(matchMakerId, form);
    alert("הפרטים עודכנו");
  };

  if (!form) return <div>טוען...</div>;

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>שם פרטי</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>שם משפחה</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>טלפון</label>
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>אימייל</label>
          <input name="email" value={form.email} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>עיר</label>
          <input name="city" value={form.city} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>מין</label>
          <select name="gender" value={form.gender} onChange={handleChange}>
            {genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>מגזר</label>
          <select name="sector" value={form.sector} onChange={handleChange}>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>מגזרים מומחים</label>
          <button
            type="button"
            className={styles.sectorsToggle}
            onClick={() => setShowSectors((p) => !p)}
          >
            בחר מגזרים
          </button>
          {showSectors && (
            <div className={styles.sectorsModal}>
              <div className={styles.sectorsGroup}>
                {sectors.map((s) => (
                  <label key={s} className={styles.sectorLabel}>
                    <input
                      type="checkbox"
                      className={styles.sectorCheckbox}
                      checked={form.expertSectors?.includes(s) || false}
                      onChange={toggleSector(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label>טווח גילאים</label>
          <div className={styles.range}>
            <input
              type="number"
              value={form.ageRange?.min ?? ""}
              onChange={handleAgeRange("min")}
              placeholder="מינ'"
            />
            <input
              type="number"
              value={form.ageRange?.max ?? ""}
              onChange={handleAgeRange("max")}
              placeholder="מקס'"
            />
          </div>
        </div>
        <div className={styles.field}>
          <label>טווח מחיר</label>
          <div className={styles.range}>
            <input
              type="number"
              value={form.priceRange?.min ?? ""}
              onChange={handlePriceRange("min")}
              placeholder="מינ'"
            />
            <input
              type="number"
              value={form.priceRange?.max ?? ""}
              onChange={handlePriceRange("max")}
              placeholder="מקס'"
            />
          </div>
        </div>
        <button type="submit" className={styles.button}>
          שמור
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
