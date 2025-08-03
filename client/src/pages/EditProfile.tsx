import { useEffect, useState } from "react";
import apiService, { MatchMaker } from "../services/api";
import { useAuth } from "../context/AuthContext";

const EditProfile: React.FC = () => {
  const { matchMakerId } = useAuth();
  const [form, setForm] = useState<MatchMaker | null>(null);

  useEffect(() => {
    if (matchMakerId) {
      apiService.getMatchmaker(matchMakerId).then(setForm);
    }
  }, [matchMakerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!form) return;
    setForm({ ...form, [e.target.name]: e.target.value } as MatchMaker);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchMakerId || !form) return;
    await apiService.updateMatchmaker(matchMakerId, form);
    alert("הפרטים עודכנו");
  };

  if (!form) return <div>טוען...</div>;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "400px",
        margin: "1rem auto",
      }}
    >
      <label>
        שם פרטי:
        <input name="firstName" value={form.firstName} onChange={handleChange} />
      </label>
      <label>
        שם משפחה:
        <input name="lastName" value={form.lastName} onChange={handleChange} />
      </label>
      <label>
        טלפון:
        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
      </label>
      <label>
        עיר:
        <input name="city" value={form.city} onChange={handleChange} />
      </label>
      <button type="submit">שמור</button>
    </form>
  );
};

export default EditProfile;
