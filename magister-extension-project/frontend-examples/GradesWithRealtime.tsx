'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface MagisterGrade {
  id: string;
  user_id: string;
  subject: string;
  grade_value: string;
  raw_payload: any;
  created_at?: string;
  updated_at?: string;
}

export default function GradesWithRealtime() {
  const [grades, setGrades] = useState<MagisterGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]); // Track new grades
  
  const supabase = createClientComponentClient();

  // Initial fetch
  useEffect(() => {
    fetchGrades();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('magister_grades_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'magister_grades',
            filter: `user_id=eq.${user.id}`
          },
          (payload: RealtimePostgresChangesPayload<MagisterGrade>) => {
            handleRealtimeChange(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    return setupSubscription().then(cleanup => cleanup?.());
  }, []);

  async function fetchGrades() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('magister_grades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleRealtimeChange(payload: RealtimePostgresChangesPayload<MagisterGrade>) {
    switch (payload.eventType) {
      case 'INSERT':
        handleNewGrade(payload.new);
        break;
      
      case 'UPDATE':
        handleUpdatedGrade(payload.new);
        break;
      
      case 'DELETE':
        handleDeletedGrade(payload.old);
        break;
    }
  }

  function handleNewGrade(newGrade: MagisterGrade) {
    console.log('🎉 New grade synced:', newGrade.subject, newGrade.grade_value);
    
    // Add to state
    setGrades(prev => [newGrade, ...prev]);
    
    // Highlight for 5 seconds
    setRecentlyAdded(prev => [...prev, newGrade.id]);
    setTimeout(() => {
      setRecentlyAdded(prev => prev.filter(id => id !== newGrade.id));
    }, 5000);
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Grade', {
        body: `${newGrade.subject}: ${newGrade.grade_value}`,
        icon: '/icon.png'
      });
    }
  }

  function handleUpdatedGrade(updatedGrade: MagisterGrade) {
    console.log('✏️ Grade updated:', updatedGrade.subject, updatedGrade.grade_value);
    
    setGrades(prev =>
      prev.map(grade =>
        grade.id === updatedGrade.id ? updatedGrade : grade
      )
    );
  }

  function handleDeletedGrade(deletedGrade: Partial<MagisterGrade>) {
    console.log('🗑️ Grade deleted:', deletedGrade.id);
    
    setGrades(prev =>
      prev.filter(grade => grade.id !== deletedGrade.id)
    );
  }

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {} as Record<string, MagisterGrade[]>);

  // Calculate average per subject
  const calculateAverage = (subjectGrades: MagisterGrade[]) => {
    const numericGrades = subjectGrades
      .map(g => parseFloat(g.grade_value))
      .filter(n => !isNaN(n));
    
    if (numericGrades.length === 0) return null;
    
    const sum = numericGrades.reduce((a, b) => a + b, 0);
    return (sum / numericGrades.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Grades</h1>
        <p className="text-gray-600">Synced in real-time from Magister</p>
      </div>

      {Object.keys(gradesBySubject).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No grades found</p>
          <p className="text-sm text-gray-400">
            Visit Magister cijfers page to sync your grades
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
            const average = calculateAverage(subjectGrades);
            
            return (
              <div key={subject} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{subject}</h2>
                  {average && (
                    <div className="text-2xl font-bold text-blue-600">
                      ⌀ {average}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {subjectGrades.map(grade => (
                    <GradeCard 
                      key={grade.id} 
                      grade={grade}
                      isNew={recentlyAdded.includes(grade.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={fetchGrades}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        🔄 Refresh Grades
      </button>
    </div>
  );
}

function GradeCard({ grade, isNew }: { grade: MagisterGrade; isNew: boolean }) {
  const description = grade.raw_payload?.Omschrijving || '';
  const date = grade.raw_payload?.Datum 
    ? new Date(grade.raw_payload.Datum).toLocaleDateString('nl-NL')
    : '';
  const weight = grade.raw_payload?.Weging || 1;

  return (
    <div className={`
      p-4 rounded-lg border-2 transition-all duration-500
      ${isNew 
        ? 'border-green-500 bg-green-50 animate-pulse' 
        : 'border-gray-200 bg-gray-50'
      }
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gray-900">
              {grade.grade_value}
            </div>
            
            <div>
              <p className="font-medium text-gray-900">{description}</p>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {date && <span>📅 {date}</span>}
                {weight > 1 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    ⚖️ {weight}x
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isNew && (
          <div className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
            NEW
          </div>
        )}
      </div>
    </div>
  );
}
