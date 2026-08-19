'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Brain,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type QuestionType =
  | 'open'
  | 'multiple-choice'
  | 'cloze'
  | 'flashcard'
  | 'step-by-step'
  | 'diagram'
  | 'translate'
  | 'code'
  | 'error-detection'
  | 'method-choice';

type Question = {
  id: string;
  type: QuestionType;
  vak: string;
  onderwerp: string;
  vraag: string;
  opties?: string[];
  correct_antwoord: string;
  uitleg?: string;
};

const QUESTION_TYPES: { id: QuestionType; label: string; icon: any }[] = [
  { id: 'open', label: 'Open vraag', icon: MessageSquare },
  { id: 'multiple-choice', label: 'Multiple choice', icon: CheckCircle },
  { id: 'cloze', label: 'Invulvraag', icon: MessageSquare },
  { id: 'flashcard', label: 'Flashcard', icon: Brain },
  { id: 'step-by-step', label: 'Stap-voor-stap', icon: ArrowRight },
  { id: 'diagram', label: 'Diagramvraag', icon: Brain },
  { id: 'translate', label: 'Vertaalvraag', icon: MessageSquare },
  { id: 'code', label: 'Codevraag', icon: Brain },
  { id: 'error-detection', label: 'Foutdetectie', icon: XCircle },
  { id: 'method-choice', label: 'Methodekeuze', icon: CheckCircle },
];

export default function ActiveRecallPage() {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    vak: '',
    onderwerp: '',
    type: 'open' as QuestionType,
    vraag: '',
    opties: '',
    correct_antwoord: '',
    uitleg: '',
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('active_recall_questions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch questions:', error);
    } else if (data) {
      setQuestions(data);
    }
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const optiesArray = formData.opties
      ? formData.opties.split(',').map((o) => o.trim())
      : undefined;

    const { data, error } = await supabase
      .from('active_recall_questions')
      .insert({
        user_id: user.id,
        vak: formData.vak,
        onderwerp: formData.onderwerp,
        type: formData.type,
        vraag: formData.vraag,
        opties: optiesArray,
        correct_antwoord: formData.correct_antwoord,
        uitleg: formData.uitleg,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add question:', error);
    } else if (data) {
      setQuestions([data, ...questions]);
      setShowAddDialog(false);
      setFormData({
        vak: '',
        onderwerp: '',
        type: 'open',
        vraag: '',
        opties: '',
        correct_antwoord: '',
        uitleg: '',
      });
    }
  };

  const startQuestion = (type: QuestionType) => {
    setSelectedType(type);
    const filteredQuestions = questions.filter((q) => q.type === type);
    const question = filteredQuestions.length > 0 ? filteredQuestions[0] : questions[0];
    setCurrentQuestion(question || null);
    setUserAnswer('');
    setShowAnswer(false);
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;

    let isCorrect = false;
    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'method-choice') {
      isCorrect = userAnswer === currentQuestion.correct_antwoord;
    } else {
      isCorrect = userAnswer.toLowerCase().includes(currentQuestion.correct_antwoord.toLowerCase());
    }

    setShowAnswer(true);
    setTotalAnswered((prev) => prev + 1);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  const nextQuestion = () => {
    const typeQuestions = questions.filter((q) => q.type === selectedType);
    const nextIndex =
      (typeQuestions.findIndex((q) => q.id === currentQuestion?.id) + 1) % typeQuestions.length;
    setCurrentQuestion(typeQuestions[nextIndex] || null);
    setUserAnswer('');
    setShowAnswer(false);
  };

  const resetSession = () => {
    setSelectedType(null);
    setCurrentQuestion(null);
    setUserAnswer('');
    setShowAnswer(false);
    setScore(0);
    setTotalAnswered(0);
  };

  if (!selectedType) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Leermodule"
          title="Active Recall Engine"
          description="Kies een vraagtype om actief je kennis te testen"
          action={
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe vraag
            </Button>
          }
        />

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => startQuestion(type.id)}
                      className="flex items-center gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {questions.filter((q) => q.type === type.id).length} vragen
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>

              {questions.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="font-display text-xl font-semibold mb-2">Geen vragen gevonden</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Je hebt nog geen vragen toegevoegd. Begin met het toevoegen van je eerste vraag.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Eerste vraag toevoegen
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Over Active Recall</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Active recall is een leertechniek waarbij je actief informatie uit je geheugen haalt
              zonder deze eerst te herlezen. Dit is veel effectiever dan passief herlezen omdat het
              je hersenen dwingt om de informatie actief op te halen en te versterken.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-secondary/50">
                <h3 className="font-medium text-foreground mb-2">Waarom werkt het?</h3>
                <ul className="space-y-1">
                  <li>• Versterkt neurale verbindingen</li>
                  <li>• Identificeert kennishiaten</li>
                  <li>• Verbetert langetermijngeheugen</li>
                  <li>• Is efficiënter dan herlezen</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h3 className="font-medium text-foreground mb-2">Tips voor gebruik</h3>
                <ul className="space-y-1">
                  <li>• Begin met het antwoord proberen</li>
                  <li>• Wacht niet te lang met checken</li>
                  <li>• Herhaal fouten direct</li>
                  <li>• Gebruik verschillende vraagtypes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Add Question Dialog */}
        <AddQuestionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={handleAddQuestion}
          formData={formData}
          setFormData={setFormData}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Leermodule"
        title="Active Recall"
        description={`Vraagtype: ${QUESTION_TYPES.find((t) => t.id === selectedType)?.label}`}
        action={
          <Button variant="outline" onClick={resetSession}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Nieuwe sessie
          </Button>
        }
      />

      <div className="mt-10 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Score: {score}/{totalAnswered}
            </span>
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: totalAnswered > 0 ? `${(score / totalAnswered) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedType(null)}>
            Terug naar overzicht
          </Button>
        </div>

        {/* Question Card */}
        {currentQuestion ? (
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{currentQuestion.vak}</span>
              <span>•</span>
              <span>{currentQuestion.onderwerp}</span>
            </div>

            <h2 className="text-xl font-semibold mb-6">{currentQuestion.vraag}</h2>

            {(currentQuestion.type === 'multiple-choice' ||
              currentQuestion.type === 'method-choice') &&
            currentQuestion.opties ? (
              <div className="space-y-3 mb-6">
                {currentQuestion.opties.map((optie, index) => (
                  <button
                    key={index}
                    onClick={() => setUserAnswer(optie)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      userAnswer === optie
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                    } ${showAnswer && optie === currentQuestion.correct_antwoord ? 'border-green-500 bg-green-500/10' : ''}`}
                    disabled={showAnswer}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                    {optie}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Typ je antwoord hier..."
                  className="w-full h-32 rounded-lg border border-border bg-background p-4 text-sm resize-none focus:border-foreground/40 outline-none"
                  disabled={showAnswer}
                />
              </div>
            )}

            {showAnswer ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    userAnswer
                      .toLowerCase()
                      .includes(currentQuestion.correct_antwoord.toLowerCase())
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <p className="font-medium mb-2">
                    {userAnswer
                      .toLowerCase()
                      .includes(currentQuestion.correct_antwoord.toLowerCase())
                      ? '✓ Correct!'
                      : '✗ Niet helemaal correct'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Jouw antwoord:</span>{' '}
                    {userAnswer || '(geen antwoord)'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Correct antwoord:</span>{' '}
                    {currentQuestion.correct_antwoord}
                  </p>
                </div>

                {currentQuestion.uitleg && (
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="font-medium mb-2">Uitleg</p>
                    <p className="text-sm text-muted-foreground">{currentQuestion.uitleg}</p>
                  </div>
                )}

                <Button onClick={nextQuestion} className="w-full">
                  Volgende vraag
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={checkAnswer} className="w-full" disabled={!userAnswer.trim()}>
                Controleer antwoord
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Geen vragen beschikbaar</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Er zijn geen vragen van dit type beschikbaar. Voeg nieuwe vragen toe om te beginnen.
            </p>
            <Button onClick={() => setSelectedType(null)}>Terug naar overzicht</Button>
          </div>
        )}
      </div>

      {/* Add Question Dialog */}
      <AddQuestionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddQuestion}
        formData={formData}
        setFormData={setFormData}
      />
    </AppShell>
  );
}

// Add Question Dialog
function AddQuestionDialog({
  open,
  onOpenChange,
  onAdd,
  formData,
  setFormData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe vraag toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vak">Vak</Label>
              <Input
                id="vak"
                value={formData.vak}
                onChange={(e) => setFormData({ ...formData, vak: e.target.value })}
                placeholder="Bijv. Wiskunde B"
              />
            </div>
            <div>
              <Label htmlFor="onderwerp">Onderwerp</Label>
              <Input
                id="onderwerp"
                value={formData.onderwerp}
                onChange={(e) => setFormData({ ...formData, onderwerp: e.target.value })}
                placeholder="Bijv. Differentiëren"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="type">Vraagtype</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="open">Open vraag</option>
              <option value="multiple-choice">Multiple choice</option>
              <option value="cloze">Invulvraag</option>
              <option value="method-choice">Methodekeuze</option>
            </select>
          </div>
          <div>
            <Label htmlFor="vraag">Vraag</Label>
            <Textarea
              id="vraag"
              value={formData.vraag}
              onChange={(e) => setFormData({ ...formData, vraag: e.target.value })}
              placeholder="De vraag..."
              rows={3}
            />
          </div>
          {(formData.type === 'multiple-choice' || formData.type === 'method-choice') && (
            <div>
              <Label htmlFor="opties">Opties (gescheiden door komma's)</Label>
              <Input
                id="opties"
                value={formData.opties}
                onChange={(e) => setFormData({ ...formData, opties: e.target.value })}
                placeholder="Optie A, Optie B, Optie C, Optie D"
              />
            </div>
          )}
          <div>
            <Label htmlFor="correct_antwoord">Correct antwoord</Label>
            <Textarea
              id="correct_antwoord"
              value={formData.correct_antwoord}
              onChange={(e) => setFormData({ ...formData, correct_antwoord: e.target.value })}
              placeholder="Het juiste antwoord..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="uitleg">Uitleg (optioneel)</Label>
            <Textarea
              id="uitleg"
              value={formData.uitleg}
              onChange={(e) => setFormData({ ...formData, uitleg: e.target.value })}
              placeholder="Extra uitleg voor het antwoord..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={onAdd}>Vraag toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
