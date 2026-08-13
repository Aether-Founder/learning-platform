'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BookOpen, Trash2, Edit } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function TestWeekDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const dateLocale = currentLanguage === 'nl' ? 'nl-NL' : 'en-US';
  const [testWeek, setTestWeek] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadTestWeek = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/testweeks/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestWeek(data.testWeek);
      }
    } catch (error) {
      console.error('Failed to load test week:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadTestWeek();
  }, [loadTestWeek]);

  const handleDelete = async () => {
    if (!confirm(t('testweekdetail_delete_confirm'))) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/testweeks/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete test week:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!testWeek) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('testweekdetail_not_found')}</p>
      </div>
    );
  }

  const startDate = new Date(testWeek.startDate);
  const endDate = new Date(testWeek.endDate);
  const today = new Date();
  const isOngoing = today >= startDate && today <= endDate;
  const isUpcoming = today < startDate;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('testweekdetail_back')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{testWeek.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {startDate.toLocaleDateString(dateLocale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' - '}
                {endDate.toLocaleDateString(dateLocale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <Badge variant={isOngoing ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                {isOngoing
                  ? t('testweekdetail_status_ongoing')
                  : isUpcoming
                    ? t('testweekdetail_status_upcoming')
                    : t('testweekdetail_status_ended')}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('testweekdetail_subjects')}</CardTitle>
            <CardDescription>{t('testweekdetail_subjects_desc', undefined, { n: testWeek.subjects.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {testWeek.subjects.length === 0 ? (
              <p className="text-muted-foreground">{t('testweekdetail_no_subjects')}</p>
            ) : (
              <div className="space-y-2">
                {testWeek.subjects.map((subject: any) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-3 text-muted-foreground" />
                      <span>{subject.subjectName}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {t('testweekdetail_study')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('testweekdetail_progress')}</CardTitle>
            <CardDescription>{t('testweekdetail_progress_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('testweekdetail_total_progress')}</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('testweekdetail_progress_hint')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
