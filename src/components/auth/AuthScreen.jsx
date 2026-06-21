import React, { useState } from 'react';
import { supabase }   from '../../lib/supabase.js';
import { AUTH_CSS }   from '../../constants/theme.js';

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [message,  setMessage]  = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError('Заполните все поля'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      if (mode === 'login') {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError(e.message === 'Invalid login credentials' ? 'Неверный email или пароль' : e.message);
        else onAuth(data.user);
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError(e.message);
        else setMessage('Письмо с подтверждением отправлено на ' + email);
      }
    } catch { setError('Ошибка соединения'); }
    setLoading(false);
  };

  const switchMode = (m) => { setMode(m); setError(''); setMessage(''); };

  return (
    <div className="auth-stage">
      <style>{AUTH_CSS}</style>
      <div className="auth-card">
        <div className="auth-logo">📅</div>
        <h1 className="auth-title">Мой день</h1>
        <p className="auth-sub">Твоя личная система жизни</p>
        <div className="auth-tabs">
          <button className={'auth-tab' + (mode === 'login'    ? ' on' : '')} onClick={() => switchMode('login')}>Войти</button>
          <button className={'auth-tab' + (mode === 'register' ? ' on' : '')} onClick={() => switchMode('register')}>Регистрация</button>
        </div>
        <input className="auth-field" type="email"    placeholder="Email"
          value={email}    onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <input className="auth-field" type="password" placeholder="Пароль (минимум 6 символов)"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
        {error   && <div className="auth-err">{error}</div>}
        {message && <div className="auth-ok">{message}</div>}
      </div>
    </div>
  );
}
