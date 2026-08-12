'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, BookOpen, Clock, Target, Check } from 'lucide-react';

interface StudyPlanWizardProps {
  userId: string;
  onComplete?: (planId: string) => void;
  onCancel?: () => void;
}

export function StudyPlanWizard({ userId: _userId, onComplete, onCancel }: StudyPlanWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [planData, setPlanData] = useState({
    title: '',
    description: '',
    goalType: 'exam' as 'exam' | 'daily' | 'custom',
    targetDate: new Date(),
    dailyGoalMinutes: 60,
    preferredTimes: [] as string[],
    selectedStudySets: [] as string[],
  });

  const steps = [
    { number: 1, title: 'Doel', icon: Target },
    { number: 2, title: 'Tijdsplanning', icon: Clock },
    { number: 3, title: 'Studie Sets', icon: BookOpen },
    { number: 4, title: 'Overzicht', icon: Check },
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/studyplans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: planData.title,
          description: planData.description,
          goalType: planData.goalType,
          targetDate: planData.targetDate.toISOString(),
          dailyGoalMinutes: planData.dailyGoalMinutes,
          preferredTimes: planData.preferredTimes,
          studySetIds: planData.selectedStudySets,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete?.(data.studyPlan.id);
      }
    } catch (error) {
      console.error('Failed to create study plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (time: string) => {
    setPlanData((prev) => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter((t) => t !== time)
        : [...prev.preferredTimes, time],
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          value={planData.title}
          onChange={(e) => setPlanData({ ...planData, title: e.target.value })}
          placeholder="Bijv. Wiskunde Toetsweek"
        />
      </div>

      <div>
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea
          id="description"
          value={planData.description}
          onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
          placeholder="Beschrijf je studiedoel..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="goalType">Type Doel *</Label>
        <Select
          value={planData.goalType}
          onValueChange={(value: any) => setPlanData({ ...planData, goalType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exam">Toets/Examen</SelectItem>
            <SelectItem value="daily">Dagelijks Doel</SelectItem>
            <SelectItem value="custom">Aangepast Doel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {planData.goalType === 'exam' && (
        <div>
          <Label>Doeldatum *</Label>
          <Calendar
            mode="single"
            selected={planData.targetDate}
            onSelect={(date) => date && setPlanData({ ...planData, targetDate: date })}
            className="rounded-md border"
          />
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="dailyGoal">Dagelijkse Doel (minuten) *</Label>
        <Input
          id="dailyGoal"
          type="number"
          value={planData.dailyGoalMinutes}
          onChange={(e) =>
            setPlanData({ ...planData, dailyGoalMinutes: parseInt(e.target.value) || 0 })
          }
          min="15"
          max="480"
        />
      </div>

      <div>
        <Label>Voorkeurstijden</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            'Ochtend (06:00-12:00)',
            'Middag (12:00-18:00)',
            'Avond (18:00-22:00)',
            'Nacht (22:00-06:00)',
          ].map((time) => (
            <div key={time} className="flex items-center space-x-2">
              <Checkbox
                id={time}
                checked={planData.preferredTimes.includes(time)}
                onCheckedChange={() => toggleTimeSlot(time)}
              />
              <Label htmlFor={time} className="cursor-pointer">
                {time}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label>Selecteer Studie Sets</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Kies de studie sets die je wilt opnemen in je plan
        </p>
        <div className="space-y-2">
          {['Wiskunde', 'Natuurkunde', 'Scheikunde', 'Biologie', 'Geschiedenis'].map((subject) => (
            <div key={subject} className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id={subject}
                checked={planData.selectedStudySets.includes(subject)}
                onCheckedChange={() => {
                  setPlanData((prev) => ({
                    ...prev,
                    selectedStudySets: prev.selectedStudySets.includes(subject)
                      ? prev.selectedStudySets.filter((s) => s !== subject)
                      : [...prev.selectedStudySets, subject],
                  }));
                }}
              />
              <Label htmlFor={subject} className="cursor-pointer flex-1">
                {subject}
              </Label>
              <Badge variant="secondary">12 sets</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Overzicht</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Titel:</span> {planData.title}
          </div>
          <div>
            <span className="font-medium">Type:</span> {planData.goalType}
          </div>
          {planData.goalType === 'exam' && (
            <div>
              <span className="font-medium">Doeldatum:</span>{' '}
              {planData.targetDate.toLocaleDateString('nl-NL')}
            </div>
          )}
          <div>
            <span className="font-medium">Dagelijks Doel:</span> {planData.dailyGoalMinutes} minuten
          </div>
          <div>
            <span className="font-medium">Voorkeurstijden:</span>{' '}
            {planData.preferredTimes.join(', ') || 'Geen'}
          </div>
          <div>
            <span className="font-medium">Studie Sets:</span> {planData.selectedStudySets.length}{' '}
            geselecteerd
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Studie Plan Wizard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= s.number
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                {s.number < steps.length && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${step > s.number ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {steps.map((s) => (
              <span key={s.number} className={step >= s.number ? 'text-primary font-medium' : ''}>
                {s.title}
              </span>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex justify-between mt-8">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Vorige
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Annuleren
              </Button>
            )}
          </div>

          {step < steps.length ? (
            <Button onClick={handleNext} disabled={!planData.title}>
              Volgende
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Maken...' : 'Plan Maken'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
