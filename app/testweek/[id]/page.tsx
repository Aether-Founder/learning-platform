"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, BookOpen, Trash2, Edit } from "lucide-react";

export default function TestWeekDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const [testWeek, setTestWeek] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestWeek();
  }, [params.id]);

  const loadTestWeek = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/testweeks/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
  };

  const handleDelete = async () => {
    if (!confirm('Weet u zeker dat u deze toetsweek wilt verwijderen?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/testweeks/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        <p>Laden...</p>
      </div>
    );
  }

  if (!testWeek) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Toetsweek niet gevonden</p>
      </div>
    );
  }

  const startDate = new Date(testWeek.startDate);
  const endDate = new Date(testWeek.endDate);
  const today = new Date();
  const isOngoing = today >= startDate && today <= endDate;
  const isUpcoming = today < startDate;
  const isPast = today > endDate;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{testWeek.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {startDate.toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' - '}
                {endDate.toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <Badge variant={isOngoing ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                {isOngoing ? 'Bezig' : isUpcoming ? 'Komt eraan' : 'Afgelopen'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Bewerken
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Verwijderen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vakken</CardTitle>
            <CardDescription>
              {testWeek.subjects.length} vakken in deze toetsweek
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testWeek.subjects.length === 0 ? (
              <p className="text-muted-foreground">Nog geen vakken toegevoegd</p>
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
                      Studeren
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voortgang</CardTitle>
            <CardDescription>
              Uw voortgang voor deze toetsweek
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Totaal voortgang</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Begin met studeren om uw voortgang bij te houden
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
