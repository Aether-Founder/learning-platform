'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, tokens: AuthTokens) => void;
  onGuestMode: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, onGuestMode }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      // Load saved credentials
      const savedCredentials = localStorage.getItem('auth_credentials');
      if (savedCredentials) {
        const credentials = JSON.parse(savedCredentials);
        setEmail(credentials.email || '');
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName: name }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registratie mislukt');
        }

        // Save credentials
        localStorage.setItem('auth_credentials', JSON.stringify({ email }));

        // Save tokens
        localStorage.setItem('access_token', data.tokens.accessToken);
        localStorage.setItem('refresh_token', data.tokens.refreshToken);
        localStorage.setItem('user_id', data.user.id);

        onAuthSuccess(data.user, data.tokens);
      } else {
        // Login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Inloggen mislukt');
        }

        // Save credentials
        localStorage.setItem('auth_credentials', JSON.stringify({ email }));

        // Save tokens
        localStorage.setItem('access_token', data.tokens.accessToken);
        localStorage.setItem('refresh_token', data.tokens.refreshToken);
        localStorage.setItem('user_id', data.user.id);

        onAuthSuccess(data.user, data.tokens);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('guest_mode', 'true');
    onGuestMode();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'login' ? 'Inloggen' : 'Registreren'}
          </h2>
          <button
            onClick={onClose}
            title="Sluiten"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Naam
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="Voer uw naam in"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Voer uw e-mail in"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Wachtwoord
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder={mode === 'login' ? 'Voer uw wachtwoord in' : 'Maak een wachtwoord aan'}
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === 'login' ? 'Inloggen...' : 'Registreren...'}
              </>
            ) : mode === 'login' ? (
              'Inloggen'
            ) : (
              'Registreren'
            )}
          </button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-primary hover:underline"
            >
              {mode === 'login'
                ? 'Nog geen account? Registreer hier'
                : 'Heb je al een account? Log hier in'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">of</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Doorgaan als gast
          </button>
        </form>
      </div>
    </div>
  );
}
