'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useUserProfile } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, LogOut } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type UserPreferences = {
  language: 'nl' | 'en';
  theme: 'light' | 'dark' | 'system';
  defaultViewMode: 'book' | 'study' | 'simple' | 'advanced';
  studyReminderDays: number[];
  timezone: string;
};

const defaultPreferences: UserPreferences = {
  language: 'nl',
  theme: 'system',
  defaultViewMode: 'book',
  studyReminderDays: [1, 2, 3, 4, 5],
  timezone: 'Europe/Amsterdam',
};

function readPreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultPreferences;
  }

  const preferences = value as Partial<UserPreferences>;
  return {
    language: preferences.language === 'en' ? 'en' : 'nl',
    theme:
      preferences.theme === 'light' || preferences.theme === 'dark' ? preferences.theme : 'system',
    defaultViewMode:
      preferences.defaultViewMode === 'study' ||
      preferences.defaultViewMode === 'simple' ||
      preferences.defaultViewMode === 'advanced'
        ? preferences.defaultViewMode
        : 'book',
    studyReminderDays: Array.isArray(preferences.studyReminderDays)
      ? preferences.studyReminderDays
      : defaultPreferences.studyReminderDays,
    timezone:
      typeof preferences.timezone === 'string' ? preferences.timezone : defaultPreferences.timezone,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    if (profile) setPreferences(readPreferences(profile.preferences));
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/profile');
        return;
      }
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('profile_not_found')}</p>
      </div>
    );
  }

  const displayName =
    profile?.full_name || user.user_metadata.full_name || user.email?.split('@')[0] || t('profile_user');
  const avatarUrl = profile?.avatar_url || user.user_metadata.avatar_url;
  const createdAt = profile?.created_at || user.created_at;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('profile_title')}</h1>
        <p className="text-muted-foreground">{t('profile_subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">{t('profile_tab_profile')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('profile_tab_preferences')}</TabsTrigger>
          <TabsTrigger value="account">{t('profile_tab_account')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_personal_info')}</CardTitle>
              <CardDescription>{t('profile_personal_info_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{displayName}</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">{t('settings_name')}</Label>
                  <Input id="displayName" defaultValue={displayName} disabled />
                </div>

                <div>
                  <Label htmlFor="email">{t('settings_email')}</Label>
                  <Input id="email" defaultValue={user.email} disabled />
                </div>

                {profile?.track && (
                  <div>
                    <Label htmlFor="track">{t('settings_profile')}</Label>
                    <Input id="track" defaultValue={profile.track} disabled />
                  </div>
                )}

                {profile?.grade_level && (
                  <div>
                    <Label htmlFor="gradeLevel">{t('settings_class')}</Label>
                    <Input id="gradeLevel" defaultValue={profile.grade_level} disabled />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings_preferences')}</CardTitle>
              <CardDescription>{t('profile_preferences_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="language">{t('settings_language')}</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value: 'nl' | 'en') =>
                      setPreferences({ ...preferences, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">{t('settings_lang_nl')}</SelectItem>
                      <SelectItem value="en">{t('settings_lang_en')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="theme">{t('settings_theme')}</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') =>
                      setPreferences({ ...preferences, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings_theme_light')}</SelectItem>
                      <SelectItem value="dark">{t('settings_theme_dark')}</SelectItem>
                      <SelectItem value="system">{t('settings_theme_system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="defaultViewMode">{t('profile_default_view_mode')}</Label>
                  <Select
                    value={preferences.defaultViewMode}
                    onValueChange={(value: 'book' | 'study' | 'simple' | 'advanced') =>
                      setPreferences({ ...preferences, defaultViewMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="book">{t('profile_view_book')}</SelectItem>
                      <SelectItem value="study">{t('profile_view_study')}</SelectItem>
                      <SelectItem value="simple">{t('profile_view_simple')}</SelectItem>
                      <SelectItem value="advanced">{t('profile_view_advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">{t('profile_timezone')}</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Amsterdam">Europe/Amsterdam</SelectItem>
                      <SelectItem value="Europe/Brussels">Europe/Brussels</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('profile_study_reminder')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('profile_study_reminder_desc')}
                    </p>
                  </div>
                  <Switch
                    checked={preferences.studyReminderDays.length > 0}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        studyReminderDays: checked ? [1, 2, 3, 4, 5] : [],
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('save')}...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('save')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile_tab_account')}</CardTitle>
              <CardDescription>{t('profile_account_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>{t('profile_plan')}</Label>
                  <p className="text-2xl font-bold">{t('profile_plan_name')}</p>
                  <p className="text-sm text-muted-foreground">{t('profile_plan_free')}</p>
                </div>

                <div>
                  <Label>{t('profile_member_since')}</Label>
                  <p className="text-sm">
                    {new Date(createdAt).toLocaleDateString(dateLocale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="destructive" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
