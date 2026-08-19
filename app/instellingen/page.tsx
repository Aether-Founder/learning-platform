'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Panel, Field, inputClass } from '@/components/ui-kit';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { useTheme } from 'next-themes';
import { useNavbarPreferences } from '@/hooks/useNavbarPreferences';
import { Upload, Check, X, Save, RotateCcw, User, Palette, Layout, BarChart3, Shield } from 'lucide-react';

const supabase = browserClient as any;

type SettingsSection = 'profile' | 'appearance' | 'navigation' | 'statistics' | 'account';

export default function InstellingenPage() {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { visibility, toggleVisibility, resetToDefaults, PAGE_LABELS, loading: navLoading } = useNavbarPreferences();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [track, setTrack] = useState('');
  const [gradeYear, setGradeYear] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [gamificationEnabled, setGamificationEnabled] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    setUser(authUser);

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setName(profileData.full_name || '');
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
      setClassLevel(profileData.grade_level || '');
      setTrack(profileData.track || '');
      setGradeYear(profileData.grade_confirmed_year || '');
      setAvatarUrl(profileData.avatar_url || '');
      setAvatarPreview(profileData.avatar_url || '');
      setGamificationEnabled(profileData.gamification_enabled || false);
    }
    setLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return;

    setUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setAvatarPreview(publicUrl);
      setAvatarFile(null);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setSaveMessage({ type: 'error', text: 'Avatar upload mislukt' });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!avatarUrl) return;

    try {
      const filePath = avatarUrl.split('/').pop();
      if (filePath) {
        await supabase.storage.from('avatars').remove([`avatars/${filePath}`]);
      }
      setAvatarUrl('');
      setAvatarPreview('');
      setAvatarFile(null);
    } catch (error) {
      console.error('Avatar removal failed:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: name,
          username: username,
          bio: bio,
          grade_level: classLevel,
          track: track,
          grade_confirmed_year: gradeYear,
          avatar_url: avatarUrl,
          gamification_enabled: gamificationEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
      
      // Update local state
      setProfile({
        ...profile,
        full_name: name,
        username: username,
        bio: bio,
        grade_level: classLevel,
        track: track,
        grade_confirmed_year: gradeYear,
        avatar_url: avatarUrl,
        gamification_enabled: gamificationEnabled,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage({ type: 'error', text: 'Opslaan mislukt' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return '??';
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Wachtwoorden komen niet overeen' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setSaveMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 tekens zijn' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Wachtwoord gewijzigd!' });
      setShowPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password change error:', error);
      setSaveMessage({ type: 'error', text: 'Wachtwoord wijzigen mislukt' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('settings_eyebrow')}
          title={t('settings_title')}
          description={t('settings_description')}
        />
        <div className="mt-10 space-y-6 max-w-4xl">
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-6">
              <div className="skeleton-circle h-24 w-24 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="skeleton-line h-4 w-1/3 rounded"></div>
                <div className="skeleton-line h-10 w-full rounded"></div>
              </div>
            </div>
          </div>
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="skeleton-line h-6 w-1/4 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="skeleton-line h-4 w-1/3 rounded"></div>
              <div className="skeleton-line h-10 w-full rounded"></div>
              <div className="skeleton-line h-4 w-1/3 rounded"></div>
              <div className="skeleton-line h-10 w-full rounded"></div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('settings_eyebrow')}
        title={t('settings_title')}
        description={t('settings_description')}
      />

      <div className="mt-10 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              Profiel
            </button>
            <button
              onClick={() => setActiveSection('appearance')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'appearance'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Palette className="h-4 w-4" />
              Uiterlijk
            </button>
            <button
              onClick={() => setActiveSection('navigation')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'navigation'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Layout className="h-4 w-4" />
              Navigatie
            </button>
            <button
              onClick={() => setActiveSection('statistics')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'statistics'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Statistieken
            </button>
            <button
              onClick={() => setActiveSection('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeSection === 'account'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" />
              Account
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl">
          {activeSection === 'profile' && (
            <Panel title={t('settings_profile')}>
              <div className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        className="h-24 w-24 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                        <span className="text-2xl font-semibold">{getInitials()}</span>
                      </div>
                    )}
                    {avatarUrl && (
                      <button
                        onClick={handleAvatarRemove}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor="avatar-upload">Profielfoto</Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="mt-1"
                      />
                    </div>
                    {avatarFile && (
                      <div className="flex gap-2">
                        <Button onClick={handleAvatarUpload} disabled={uploading} size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Uploaden...' : 'Uploaden'}
                        </Button>
                        <Button onClick={() => { setAvatarFile(null); setAvatarPreview(avatarUrl); }} variant="outline" size="sm">
                          Annuleren
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG of GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('settings_name')}>
                    <Input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Je volledige naam"
                    />
                  </Field>
                  <Field label="Gebruikersnaam">
                    <Input 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Gebruikersnaam"
                    />
                  </Field>
                </div>

                <Field label="Bio">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Vertel iets over jezelf..."
                    rows={3}
                  />
                </Field>

                {/* School Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('settings_class')}>
                    <Input 
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  placeholder="Bijv. VWO 4"
                />
              </Field>
              <Field label={t('settings_profile')}>
                <select 
                  className={inputClass}
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                >
                  <option value="">Kies een profiel</option>
                  <option value="nt">{t('settings_track_nt')}</option>
                  <option value="ng">{t('settings_track_ng')}</option>
                  <option value="em">{t('settings_track_em')}</option>
                  <option value="cm">{t('settings_track_cm')}</option>
                </select>
              </Field>
            </div>

            <Field label="Schooljaar">
              <Input 
                value={gradeYear}
                onChange={(e) => setGradeYear(e.target.value)}
                placeholder="Bijv. 2024-2025"
              />
            </Field>
          </div>
        </Panel>
          )}

          {activeSection === 'appearance' && (
            <Panel title={t('settings_preferences')}>
              <div className="space-y-4">
                <Field label={t('settings_theme')}>
                  <select 
                    className={inputClass}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  >
                    <option value="system">{t('settings_theme_system')}</option>
                    <option value="light">{t('settings_theme_light')}</option>
                    <option value="dark">{t('settings_theme_dark')}</option>
                  </select>
                </Field>
                <Field label={t('settings_language')}>
                  <select 
                    className={inputClass}
                    value={currentLanguage}
                    onChange={(e) => changeLanguage(e.target.value as any)}
                  >
                    <option value="nl">Nederlands</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="zh">中文</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="ar">العربية</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="hi">हिन्दी</option>
                    <option value="pt">Português</option>
                    <option value="it">Italiano</option>
                    <option value="tr">Türkçe</option>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="th">ไทย</option>
                    <option value="pl">Polski</option>
                    <option value="uk">Українська</option>
                  </select>
                </Field>
                <Field label="Gamification">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="gamification-toggle"
                      checked={gamificationEnabled}
                      onChange={(e) => setGamificationEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                    />
                    <label htmlFor="gamification-toggle" className="text-sm text-zinc-400">
                      XP & Streak systeem inschakelen
                    </label>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    Verdiene punten voor studeren en behoud een leer-streak. Kan op elk moment worden uitgeschakeld.
                  </p>
                </Field>
              </div>
            </Panel>
          )}

          {activeSection === 'navigation' && (
            <Panel title="Navigatiebalk">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Kies welke pagina's in de navigatiebalk worden weergegeven. Verborgen pagina's zijn nog steeds toegankelijk via andere routes.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(PAGE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibility[key]}
                        onChange={() => toggleVisibility(key as any)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  className="mt-2"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Standaard instellingen herstellen
                </Button>
              </div>
            </Panel>
          )}

          {activeSection === 'statistics' && (
            <Panel title="Statistieken">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Bekijk je leerstatistieken en voortgang hier.
                </p>
                <div className="pt-4">
                  <Link href="/statistieken">
                    <Button className="w-full">
                      Ga naar Statistieken
                      <BarChart3 className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Panel>
          )}

          {activeSection === 'account' && (
            <Panel title="Account">
              <div className="space-y-4">
                <Field label="E-mail">
                  <Input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    E-mail kan niet worden gewijzigd.
                  </p>
                </Field>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Wachtwoord wijzigen
                </Button>
              </div>
            </Panel>
          )}

          {/* Save Button */}
          {activeSection !== 'statistics' && (
            <div className="flex items-center justify-between mt-6">
              {saveMessage && (
                <div className={`flex items-center gap-2 text-sm ${
                  saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {saveMessage.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {saveMessage.text}
                </div>
              )}
              <Button 
                onClick={handleSave}
                disabled={loading}
                className="ml-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Opslaan...' : t('settings_save')}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wachtwoord wijzigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nieuw wachtwoord</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimaal 6 tekens"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Typ opnieuw"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handlePasswordChange} disabled={loading}>
              {loading ? 'Wijzigen...' : 'Wijzigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
