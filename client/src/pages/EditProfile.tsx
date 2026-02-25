import { useEffect, useState } from "react";
import apiService, { MatchMaker } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { genders, sectors } from "../utils/enums";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";

const EditProfile: React.FC = () => {
  const { matchMakerId } = useAuth();
  const [form, setForm] = useState<MatchMaker | null>(null);
  const [showSectors, setShowSectors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!matchMakerId) return;
    apiService.getMatchmaker(matchMakerId).then(setForm);
  }, [matchMakerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!form) return;
    const { name, value } = e.target;
    setForm({ ...form, [name]: value } as MatchMaker);
    setSaved(false);
  };

  const toggleSector = (sector: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    const current = new Set(form.expertSectors || []);
    if (e.target.checked) current.add(sector);
    else current.delete(sector);
    setForm({ ...form, expertSectors: Array.from(current) });
    setSaved(false);
  };

  const handleAgeRange = (field: "min" | "max") => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    const value = e.target.value ? Number(e.target.value) : undefined;
    setForm({ ...form, ageRange: { ...form.ageRange, [field]: value } });
    setSaved(false);
  };

  const handlePriceRange = (field: "min" | "max") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!form) return;
    const value = e.target.value ? Number(e.target.value) : undefined;
    setForm({ ...form, priceRange: { ...form.priceRange, [field]: value } });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchMakerId || !form) return;
    setSaving(true);
    try {
      await apiService.updateMatchmaker(matchMakerId, form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="page-shell">
        <Card>
          <CardHeader>
            <CardTitle>טוען פרופיל...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Card className="mx-auto max-w-4xl border-border/70">
        <CardHeader>
          <CardTitle>עריכת פרטי שדכן</CardTitle>
          <CardDescription>
            עדכון פרטים אישיים, תחומי התמחות וטווחי עבודה
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">טלפון</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">עיר</Label>
              <Input id="city" name="city" value={form.city} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">מין</Label>
              <Select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">מגזר מוביל</Label>
              <Select id="sector" name="sector" value={form.sector} onChange={handleChange}>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>מגזרי התמחות</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSectors((prev) => !prev)}
                >
                  {showSectors ? "סגור" : "בחר מגזרים"}
                </Button>
              </div>

              {showSectors && (
                <div className="grid grid-cols-2 gap-2 rounded-md border border-border/70 bg-muted/40 p-3 sm:grid-cols-3 md:grid-cols-4">
                  {sectors.map((sector) => (
                    <label
                      key={sector}
                      className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={form.expertSectors?.includes(sector) || false}
                        onChange={toggleSector(sector)}
                      />
                      <span>{sector}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>טווח גילאים</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={form.ageRange?.min ?? ""}
                  onChange={handleAgeRange("min")}
                  placeholder="מינימום"
                />
                <Input
                  type="number"
                  value={form.ageRange?.max ?? ""}
                  onChange={handleAgeRange("max")}
                  placeholder="מקסימום"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>טווח מחיר</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={form.priceRange?.min ?? ""}
                  onChange={handlePriceRange("min")}
                  placeholder="מינימום"
                />
                <Input
                  type="number"
                  value={form.priceRange?.max ?? ""}
                  onChange={handlePriceRange("max")}
                  placeholder="מקסימום"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "שומר..." : "שמור שינויים"}
              </Button>
              {saved && <span className="text-sm text-primary">הפרטים נשמרו בהצלחה</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
