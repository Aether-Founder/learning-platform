'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  FileText,
  Target,
  Brain,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type ContentType = 'subject' | 'chapter' | 'learningset' | 'quiz' | 'summary' | 'practice-test';

interface ContentExample {
  title: string;
  description: string;
  jsonExample: string;
  schema: string;
}

const contentExamples: Record<ContentType, ContentExample> = {
  subject: {
    title: 'Vak',
    description: 'Voeg een nieuw vak toe aan de platform',
    jsonExample: `{
  "name": "Biologie",
  "description": "Leer over levende organismen en hun processen",
  "color": "#22c55e",
  "icon": "flask"
}`,
    schema: `{
  "name": "string (required) - Naam van het vak",
  "description": "string (required) - Beschrijving van het vak",
  "color": "string (optional) - Hex kleur code",
  "icon": "string (optional) - Icon naam"
}`,
  },
  chapter: {
    title: 'Hoofdstuk',
    description: 'Voeg een hoofdstuk toe aan een vak',
    jsonExample: `{
  "subject_id": "uuid-of-subject",
  "title": "Celbiologie",
  "description": "Inleiding tot cellen en hun functies",
  "order": 1
}`,
    schema: `{
  "subject_id": "string (required) - UUID van het bijbehorende vak",
  "title": "string (required) - Titel van het hoofdstuk",
  "description": "string (required) - Beschrijving",
  "order": "number (optional) - Volgorde nummer"
}`,
  },
  learningset: {
    title: 'Leerset',
    description: 'Voeg een leerset (flashcards) toe',
    jsonExample: `{
  "subject_id": "uuid-of-subject",
  "chapter_id": "uuid-of-chapter",
  "title": "Celstructure Flashcards",
  "description": "Flashcards over celstructuren",
  "cards": [
    {
      "front": "Wat is de functie van de celkern?",
      "back": "De celkern bevat het DNA en controleert alle celactiviteiten",
      "source_text": "Biologie tekstboek pagina 45"
    },
    {
      "front": "Wat zijn ribosomen?",
      "back": "Ribosomen zijn verantwoordelijk voor eiwitsynthese",
      "source_text": null
    }
  ]
}`,
    schema: `{
  "subject_id": "string (required) - UUID van het vak",
  "chapter_id": "string (optional) - UUID van het hoofdstuk",
  "title": "string (required) - Titel van de leerset",
  "description": "string (required) - Beschrijving",
  "cards": "array (required) - Array van flashcard objecten",
  "cards[].front": "string (required) - Vraag",
  "cards[].back": "string (required) - Antwoord",
  "cards[].source_text": "string (optional) - Bron tekst"
}`,
  },
  quiz: {
    title: 'Quiz',
    description: 'Voeg een quiz toe met vragen',
    jsonExample: `{
  "subject_id": "uuid-of-subject",
  "chapter_id": "uuid-of-chapter",
  "title": "Celbiologie Quiz",
  "description": "Test je kennis over cellen",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Wat is de functie van mitochondria?",
      "options": [
        "Eiwitsynthese",
        "Energieproductie",
        "DNA opslag",
        "Celdeling"
      ],
      "correct_answer": 1,
      "explanation": "Mitochondria staan bekend als de energiecentrales van de cel"
    },
    {
      "type": "open",
      "question": "Beschrijf het proces van celdeling",
      "model_answer": "Celdeling is het proces waarbij een cel zich splitst in twee dochtercellen...",
      "explanation": "Dit omvat mitose en meiose"
    }
  ]
}`,
    schema: `{
  "subject_id": "string (required) - UUID van het vak",
  "chapter_id": "string (optional) - UUID van het hoofdstuk",
  "title": "string (required) - Titel van de quiz",
  "description": "string (required) - Beschrijving",
  "questions": "array (required) - Array van vraag objecten",
  "questions[].type": "string (required) - 'multiple_choice' of 'open'",
  "questions[].question": "string (required) - De vraag",
  "questions[].options": "array (optional) - Opties voor multiple choice",
  "questions[].correct_answer": "number (optional) - Index van correct antwoord",
  "questions[].model_answer": "string (optional) - Model antwoord voor open vragen",
  "questions[].explanation": "string (optional) - Uitleg van het antwoord"
}`,
  },
  summary: {
    title: 'Samenvatting',
    description: 'Voeg een samenvatting toe',
    jsonExample: `{
  "subject_id": "uuid-of-subject",
  "chapter_id": "uuid-of-chapter",
  "title": "Samenvatting Celbiologie",
  "content": "# Celbiologie\\n\\nCellen zijn de basisbouwstenen van alle levende organismen...",
  "tags": ["cel", "biologie", "basis"],
  "difficulty": "beginner"
}`,
    schema: `{
  "subject_id": "string (required) - UUID van het vak",
  "chapter_id": "string (optional) - UUID van het hoofdstuk",
  "title": "string (required) - Titel van de samenvatting",
  "content": "string (required) - Inhoud (kan markdown bevatten)",
  "tags": "array (optional) - Array van tags",
  "difficulty": "string (optional) - 'beginner', 'intermediate', of 'advanced'"
}`,
  },
  'practice-test': {
    title: 'Oefentoets',
    description: 'Voeg een oefentoets toe',
    jsonExample: `{
  "subject_id": "uuid-of-subject",
  "chapter_id": "uuid-of-chapter",
  "title": "Oefentoets Celbiologie",
  "description": "Complete oefentoets over celbiologie",
  "duration_minutes": 45,
  "passing_score": 70,
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Wat is de functie van de celmembraan?",
      "options": ["Bescherming", "Transport", "Beide", "Geen"],
      "correct_answer": 2,
      "points": 5
    }
  ]
}`,
    schema: `{
  "subject_id": "string (required) - UUID van het vak",
  "chapter_id": "string (optional) - UUID van het hoofdstuk",
  "title": "string (required) - Titel van de oefentoets",
  "description": "string (required) - Beschrijving",
  "duration_minutes": "number (required) - Tijdslimiet in minuten",
  "passing_score": "number (required) - Minimum score om te slagen (0-100)",
  "questions": "array (required) - Array van vraag objecten",
  "questions[].type": "string (required) - Type vraag",
  "questions[].question": "string (required) - De vraag",
  "questions[].options": "array (optional) - Opties",
  "questions[].correct_answer": "number (optional) - Correct antwoord index",
  "questions[].points": "number (required) - Punten voor deze vraag"
}`,
  },
};

const adminSections = [
  {
    title: 'Analytics',
    description: 'Bekijk gebruikersstatistieken en activiteit',
    icon: LayoutDashboard,
    href: '/admin/analytics',
    color: 'text-blue-500',
  },
  {
    title: 'Artisan',
    description: 'Beheer Artisan AI verwerkingswachtrij',
    icon: BookOpen,
    href: '/admin/artisan',
    color: 'text-purple-500',
  },
  {
    title: 'Lessen',
    description: 'Beheer lesinhoud en structuur',
    icon: FileText,
    href: '/admin/lessons',
    color: 'text-green-500',
  },
];

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Server-side authentication - no client-side access to credentials
  const [authenticating, setAuthenticating] = useState(false);
  const [authEmail, setAuthEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthenticating(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authEmail,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
        setAuthEmail('');
        toast.success('Admin authentication successful');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setAuthError('Failed to authenticate. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  const openContentModal = (type: ContentType) => {
    setSelectedContentType(type);
    setJsonInput(contentExamples[type].jsonExample);
    setShowContentModal(true);
  };

  const handleSubmitContent = async () => {
    if (!selectedContentType) return;

    setIsSubmitting(true);

    try {
      const parsedJson = JSON.parse(jsonInput);

      let tableName = '';
      let insertData = {};

      switch (selectedContentType) {
        case 'subject':
          tableName = 'subjects';
          insertData = {
            name: parsedJson.name,
            description: parsedJson.description,
            color: parsedJson.color || '#3b82f6',
            icon: parsedJson.icon || 'book',
            user_id: null, // Global content
            mastery: 0,
          };
          break;
        case 'chapter':
          tableName = 'chapters';
          insertData = {
            subject_id: parsedJson.subject_id,
            title: parsedJson.title,
            description: parsedJson.description,
            order: parsedJson.order || 0,
          };
          break;
        case 'learningset':
          tableName = 'decks';
          insertData = {
            user_id: null, // Global content
            name: parsedJson.title,
            description: parsedJson.description,
            subject_id: parsedJson.subject_id,
            chapter_id: parsedJson.chapter_id,
          };
          break;
        case 'quiz':
          tableName = 'quizzes';
          insertData = {
            subject_id: parsedJson.subject_id,
            chapter_id: parsedJson.chapter_id,
            title: parsedJson.title,
            description: parsedJson.description,
            questions: parsedJson.questions,
            user_id: null, // Global content
          };
          break;
        case 'summary':
          tableName = 'summaries';
          insertData = {
            subject_id: parsedJson.subject_id,
            chapter_id: parsedJson.chapter_id,
            title: parsedJson.title,
            content: parsedJson.content,
            tags: parsedJson.tags || [],
            difficulty: parsedJson.difficulty || 'intermediate',
            user_id: null, // Global content
          };
          break;
        case 'practice-test':
          tableName = 'practice_tests';
          insertData = {
            subject_id: parsedJson.subject_id,
            chapter_id: parsedJson.chapter_id,
            title: parsedJson.title,
            description: parsedJson.description,
            duration_minutes: parsedJson.duration_minutes,
            passing_score: parsedJson.passing_score,
            questions: parsedJson.questions,
            user_id: null, // Global content
          };
          break;
      }

      const { data, error } = await supabase.from(tableName).insert([insertData]).select().single();

      if (error) throw error;

      // If learningset, also insert the cards
      if (selectedContentType === 'learningset' && parsedJson.cards) {
        const cards = parsedJson.cards.map((card: any) => ({
          deck_id: data.id,
          front: card.front,
          back: card.back,
          source_text: card.source_text || null,
        }));

        const { error: cardsError } = await supabase.from('cards').insert(cards);

        if (cardsError) throw cardsError;
      }

      toast.success(`${contentExamples[selectedContentType].title} succesvol toegevoegd!`);
      setShowContentModal(false);
      setJsonInput('');
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error('Fout bij toevoegen content. Controleer de JSON en probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitContent();
    }
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Voer je admin credentials in om toegang te krijgen tot de admin portal.
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Voer admin email in"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Admin Wachtwoord
                  </label>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Voer admin wachtwoord in"
                    required
                  />
                </div>
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={authenticating || !authEmail.trim() || !password.trim()}
                >
                  {authenticating ? 'Authenticeren...' : 'Inloggen'}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center">
                Both email and password are validated server-side for maximum security.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Admin Portal"
        description="Beheer platform content en bekijk statistieken"
      />

      <div className="mt-10 space-y-8">
        {/* Existing Admin Sections */}
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Beheer Secties</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-secondary ${section.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content Management */}
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Content Toevoegen</h2>
          <p className="text-muted-foreground mb-6">
            Voeg globale content toe via JSON. Deze content is zichtbaar voor alle gebruikers.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(contentExamples) as ContentType[]).map((type) => {
              const example = contentExamples[type];
              return (
                <Card key={type} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{example.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{example.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => openContentModal(type)}
                    className="w-full"
                    variant="outline"
                  >
                    Voeg {example.title.toLowerCase()} toe
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Modal */}
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContentType && contentExamples[selectedContentType].title} Toevoegen
            </DialogTitle>
          </DialogHeader>

          {selectedContentType && (
            <div className="space-y-4 py-4">
              {/* Documentation */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">JSON Schema</h4>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                  {contentExamples[selectedContentType].schema}
                </pre>
              </div>

              {/* JSON Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  JSON Content (Ctrl+Enter om op te slaan)
                </label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={contentExamples[selectedContentType].jsonExample}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              {/* Example */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-500">Voorbeeld</h4>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                  {contentExamples[selectedContentType].jsonExample}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContentModal(false)}
              disabled={isSubmitting}
            >
              Annuleren
            </Button>
            <Button onClick={handleSubmitContent} disabled={isSubmitting || !jsonInput.trim()}>
              {isSubmitting ? 'Toevoegen...' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
