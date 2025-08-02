import React, { useState } from 'react';

const Login: React.FC = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      window.location.href = `/dashboard/${id}`;
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login לשדכן</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Shadchan ID:</label>
          <input value={id} onChange={e => setId(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">כניסה</button>
      </form>
    </div>
  );
};

export default Login;
