import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Login failed');
        return;
      }
      const data = await res.json();
      login(data.token);
    } catch {
      setError('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px', margin: 'auto' }}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder='Email' />
      <input type='password' value={password} onChange={e => setPassword(e.target.value)} placeholder='Password' />
      <button type='submit'>Login</button>
    </form>
  );
};

export default Login;
