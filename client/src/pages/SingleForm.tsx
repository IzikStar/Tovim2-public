import React, { useState } from 'react';

interface Props {
  matchmakerId: string;
}

interface FormData {
  name: string;
  age: string;
  gender: string;
  details: string;
  images: string[];
}

const SingleForm: React.FC<Props> = ({ matchmakerId }) => {
  const [form, setForm] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    details: '',
    images: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((images) => setForm((f) => ({ ...f, images })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/singles/register/${matchmakerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to submit');
      alert('פרטים נשלחו לשדכן ' + matchmakerId);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשליחת הטופס');
    }
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
        <div>
          <label>תמונות:</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
        </div>
        <button type="submit">שליחה</button>
      </form>
    </div>
  );
};

export default SingleForm;
