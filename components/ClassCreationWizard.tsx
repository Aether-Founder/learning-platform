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
import { ChevronLeft, ChevronRight, Users, Settings, Check } from 'lucide-react';

interface ClassCreationWizardProps {
  userId: string;
  onComplete?: (classId: string) => void;
  onCancel?: () => void;
}

export function ClassCreationWizard({ onComplete, onCancel }: ClassCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [classData, setClassData] = useState({
    name: '',
    description: '',
    subject: '',
    grade: '',
    schoolYear: '',
    isPublic: false,
    allowStudentJoin: true,
    requireApproval: false,
  });

  const steps = [
    { number: 1, title: 'Basis Info', icon: Users },
    { number: 2, title: 'Instellingen', icon: Settings },
    { number: 3, title: 'Overzicht', icon: Check },
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
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: classData.name,
          description: classData.description,
          subject: classData.subject,
          grade: classData.grade,
          schoolYear: classData.schoolYear,
          isPublic: classData.isPublic,
          allowStudentJoin: classData.allowStudentJoin,
          requireApproval: classData.requireApproval,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete?.(data.class.id);
      }
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Klas Naam *</Label>
        <Input
          id="name"
          value={classData.name}
          onChange={(e) => setClassData({ ...classData, name: e.target.value })}
          placeholder="Bijv. Wiskunde 5VWO"
        />
      </div>

      <div>
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea
          id="description"
          value={classData.description}
          onChange={(e) => setClassData({ ...classData, description: e.target.value })}
          placeholder="Beschrijf de klas..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="subject">Vak *</Label>
        <Select
          value={classData.subject}
          onValueChange={(value) => setClassData({ ...classData, subject: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecteer een vak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wiskunde">Wiskunde</SelectItem>
            <SelectItem value="natuurkunde">Natuurkunde</SelectItem>
            <SelectItem value="scheikunde">Scheikunde</SelectItem>
            <SelectItem value="biologie">Biologie</SelectItem>
            <SelectItem value="geschiedenis">Geschiedenis</SelectItem>
            <SelectItem value="aardrijkskunde">Aardrijkskunde</SelectItem>
            <SelectItem value="nederlands">Nederlands</SelectItem>
            <SelectItem value="engels">Engels</SelectItem>
            <SelectItem value="frans">Frans</SelectItem>
            <SelectItem value="duits">Duits</SelectItem>
            <SelectItem value="economie">Economie</SelectItem>
            <SelectItem value="overig">Overig</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grade">Klas</Label>
          <Select
            value={classData.grade}
            onValueChange={(value) => setClassData({ ...classData, grade: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer klas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1e Jaar</SelectItem>
              <SelectItem value="2">2e Jaar</SelectItem>
              <SelectItem value="3">3e Jaar</SelectItem>
              <SelectItem value="4">4e Jaar</SelectItem>
              <SelectItem value="5">5e Jaar</SelectItem>
              <SelectItem value="6">6e Jaar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="schoolYear">Schooljaar</Label>
          <Select
            value={classData.schoolYear}
            onValueChange={(value) => setClassData({ ...classData, schoolYear: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Schooljaar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
              <SelectItem value="2025-2026">2025-2026</SelectItem>
              <SelectItem value="2026-2027">2026-2027</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublic"
            checked={classData.isPublic}
            onCheckedChange={(checked: boolean) =>
              setClassData({ ...classData, isPublic: checked })
            }
          />
          <Label htmlFor="isPublic" className="cursor-pointer">
            Maak klas openbaar (zoekbaar voor anderen)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowStudentJoin"
            checked={classData.allowStudentJoin}
            onCheckedChange={(checked: boolean) =>
              setClassData({ ...classData, allowStudentJoin: checked })
            }
          />
          <Label htmlFor="allowStudentJoin" className="cursor-pointer">
            Sta leerlingen toe om zich aan te melden
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="requireApproval"
            checked={classData.requireApproval}
            onCheckedChange={(checked: boolean) =>
              setClassData({ ...classData, requireApproval: checked })
            }
            disabled={!classData.allowStudentJoin}
          />
          <Label htmlFor="requireApproval" className="cursor-pointer">
            Vereist goedkeuring voor aanmeldingen
          </Label>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Informatie over instellingen</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Openbare klassen kunnen door iedereen worden gezocht</li>
          <li>• Leerlingen kunnen zich aanmelden als dit is toegestaan</li>
          <li>• Met goedkeuring moet u elke aanmelding accepteren</li>
        </ul>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Overzicht</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Naam:</span> {classData.name}
          </div>
          <div>
            <span className="font-medium">Beschrijving:</span> {classData.description || 'Geen'}
          </div>
          <div>
            <span className="font-medium">Vak:</span> {classData.subject}
          </div>
          <div>
            <span className="font-medium">Klas:</span> {classData.grade || 'Niet geselecteerd'}
          </div>
          <div>
            <span className="font-medium">Schooljaar:</span>{' '}
            {classData.schoolYear || 'Niet geselecteerd'}
          </div>
          <div>
            <span className="font-medium">Openbaar:</span> {classData.isPublic ? 'Ja' : 'Nee'}
          </div>
          <div>
            <span className="font-medium">Leerlingen toegestaan:</span>{' '}
            {classData.allowStudentJoin ? 'Ja' : 'Nee'}
          </div>
          <div>
            <span className="font-medium">Goedkeuring vereist:</span>{' '}
            {classData.requireApproval ? 'Ja' : 'Nee'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Klas Aanmaak Wizard</CardTitle>
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
            <Button onClick={handleNext} disabled={!classData.name || !classData.subject}>
              Volgende
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Maken...' : 'Klas Maken'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
