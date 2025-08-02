import React, { useState } from 'react';

interface Props {
  matchmakerId: string;
}

const SingleForm: React.FC<Props> = ({ matchmakerId }) => {
  const [form, setForm] = useState({ name: '', age: '', gender: '', details: '' });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('פרטים נשלחו לשדכן ' + matchmakerId);
  };
  return (
    <div style={{ padding: '2rem' }}>
      <h2>שאלון לסינגל</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>שם:</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>גיל:</label>
          <input name="age" value={form.age} onChange={handleChange} />
        </div>
        <div>
          <label>מגדר:</label>
          <input name="gender" value={form.gender} onChange={handleChange} />
        </div>
        <div>
          <label>פרטים נוספים:</label>
          <textarea name="details" value={form.details} onChange={handleChange} rows={5} />
        </div>
        <button type="submit">שליחה</button>
      </form>
    </div>
  );
};

export default SingleForm;
