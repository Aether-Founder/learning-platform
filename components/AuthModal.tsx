'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from '@/lib/supabase/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  initialMode?: 'login' | 'register';
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  onGuestMode: _onGuestMode,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [initialMode, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password.length < 6) throw new Error('Wachtwoord moet minimaal 6 tekens bevatten.');
      const username = (name.trim() || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const result = mode === 'register'
        ? await signUp({ email, password, username, fullName: name.trim() || username })
        : await signIn({ email, password });

      if (result.error) throw result.error;
      if (!result.data.session || !result.data.user) {
        setError('Controleer je e-mail om je account te bevestigen en log daarna in.');
        return;
      }

      onAuthSuccess(
        {
          id: result.data.user.id,
          email: result.data.user.email || email,
          displayName: result.data.user.user_metadata?.full_name || name || email.split('@')[0],
        },
        {
          accessToken: result.data.session.access_token,
          refreshToken: result.data.session.refresh_token,
        }
      );
      onClose();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Aether</p>
          <DialogTitle>{mode === 'login' ? 'Inloggen' : 'Account maken'}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? 'Ga verder met je persoonlijke leeromgeving.' : 'Maak een lege, persoonlijke werkruimte aan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="modal-name" className="mb-2 block text-sm font-medium">Naam</label>
              <input id="modal-name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Je naam" required />
            </div>
          )}
          <div>
            <label htmlFor="modal-email" className="mb-2 block text-sm font-medium">E-mailadres</label>
            <input id="modal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="naam@voorbeeld.nl" autoComplete="email" required />
          </div>
          <div>
            <label htmlFor="modal-password" className="mb-2 block text-sm font-medium">Wachtwoord</label>
            <input id="modal-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Minimaal 6 tekens" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required />
          </div>
          {error && <p role="alert" className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Even geduld…' : mode === 'login' ? 'Inloggen' : 'Account maken'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full text-center text-sm text-primary hover:underline">
            {mode === 'login' ? 'Nog geen account? Registreren' : 'Al een account? Inloggen'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
