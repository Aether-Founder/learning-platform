'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface StudyCard {
  id: string;
  term: string;
  definition: string;
  imageUrl?: string;
}

interface TestConfig {
  questionType: 'term' | 'definition' | 'both';
  answerType: 'multipleChoice' | 'written';
  shuffle: boolean;
  timeLimit?: number;
}

interface TestModeProps {
  cards: StudyCard[];
  onComplete: (results: {
    correct: number;
    incorrect: number;
    answers: Array<{ cardId: string; correct: boolean }>;
  }) => void;
  onExit: () => void;
}

export function TestMode({ cards, onComplete, onExit }: TestModeProps) {
  const [config, setConfig] = useState<TestConfig>({
    questionType: 'term',
    answerType: 'multipleChoice',
    shuffle: false,
  });
  const [showConfig, setShowConfig] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answers, setAnswers] = useState<Array<{ cardId: string; correct: boolean }>>([]);

  const shuffledCards = config.shuffle ? [...cards].sort(() => Math.random() - 0.5) : cards;

  const currentCard = shuffledCards[currentIndex];
  const progress = ((currentIndex + 1) / shuffledCards.length) * 100;

  const generateOptions = (correctAnswer: string): string[] => {
    const options = [correctAnswer];
    const otherCards = cards.filter((c) => c.id !== currentCard.id);

    while (options.length < 4 && otherCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherCards.length);
      const wrongAnswer =
        config.questionType === 'term'
          ? otherCards[randomIndex].term
          : otherCards[randomIndex].definition;

      if (!options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
      otherCards.splice(randomIndex, 1);
    }

    return options.sort(() => Math.random() - 0.5);
  };

  const options =
    config.answerType === 'multipleChoice' && currentCard
      ? generateOptions(config.questionType === 'term' ? currentCard.definition : currentCard.term)
      : [];

  const handleStart = () => {
    setShowConfig(false);
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect =
      config.questionType === 'term'
        ? answer === currentCard.definition
        : answer === currentCard.term;

    if (isCorrect) {
      setCorrect(correct + 1);
    } else {
      setIncorrect(incorrect + 1);
    }

    setAnswers([...answers, { cardId: currentCard.id, correct: isCorrect }]);
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);

    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete({ correct, incorrect, answers });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setCorrect(0);
    setIncorrect(0);
    setAnswers([]);
    setShowConfig(true);
  };

  if (showConfig) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Terug
          </Button>
          <h2 className="text-2xl font-bold">Test Configuratie</h2>
          <div className="w-20" />
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Vraag type</label>
            <select
              value={config.questionType}
              onChange={(e) => setConfig({ ...config, questionType: e.target.value as any })}
              className="w-full p-2 border border-border rounded-md"
            >
              <option value="term">Toon term, raad definitie</option>
              <option value="definition">Toon definitie, raad term</option>
              <option value="both">Willekeurig</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Antwoord type</label>
            <select
              value={config.answerType}
              onChange={(e) => setConfig({ ...config, answerType: e.target.value as any })}
              className="w-full p-2 border border-border rounded-md"
            >
              <option value="multipleChoice">Meerkeuze</option>
              <option value="written">Geschreven</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shuffle"
              checked={config.shuffle}
              onChange={(e) => setConfig({ ...config, shuffle: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="shuffle" className="text-sm">
              Shuffle kaarten
            </label>
          </div>

          <Button onClick={handleStart} className="w-full" size="lg">
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Geen kaarten om te testen</p>
        <Button onClick={onExit}>Terug</Button>
      </div>
    );
  }

  const question =
    config.questionType === 'definition' || (config.questionType === 'both' && Math.random() > 0.5)
      ? currentCard.definition
      : currentCard.term;

  const correctAnswer =
    config.questionType === 'definition' ||
    (config.questionType === 'both' && question === currentCard.definition)
      ? currentCard.term
      : currentCard.definition;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Verlaten
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {shuffledCards.length}
        </div>
        <Button variant="ghost" size="sm" onClick={handleRestart}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Herstart
        </Button>
      </div>

      <Progress value={progress} className="mb-6" />

      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">Vraag</p>
          <h2 className="text-2xl font-semibold">{question}</h2>
        </div>

        {currentCard.imageUrl && (
          <div className="mb-8">
            <img
              src={currentCard.imageUrl}
              alt={currentCard.term}
              className="max-h-48 mx-auto rounded-lg"
            />
          </div>
        )}

        {config.answerType === 'multipleChoice' ? (
          <div className="space-y-3">
            {options.map((option, index) => (
              <Button
                key={index}
                onClick={() => !showResult && handleAnswer(option)}
                variant={
                  showResult
                    ? option === correctAnswer
                      ? 'default'
                      : selectedAnswer === option
                        ? 'destructive'
                        : 'outline'
                    : 'outline'
                }
                className={`w-full text-left justify-start ${
                  showResult && option === correctAnswer ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
                disabled={showResult}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Typ je antwoord..."
              className="w-full p-3 border border-border rounded-md"
              disabled={showResult}
              value={selectedAnswer || ''}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
            {!showResult && (
              <Button onClick={() => handleAnswer(selectedAnswer || '')} className="w-full">
                Submit
              </Button>
            )}
          </div>
        )}

        {showResult && (
          <div className="mt-6 p-4 rounded-lg bg-secondary">
            <p className="font-semibold mb-2">
              {selectedAnswer === correctAnswer ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Correct!
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Fout
                </span>
              )}
            </p>
            {selectedAnswer !== correctAnswer && (
              <p className="text-sm text-muted-foreground">Juist antwoord: {correctAnswer}</p>
            )}
            <Button onClick={handleNext} className="w-full mt-4">
              {currentIndex < shuffledCards.length - 1 ? 'Volgende' : 'Bekijk resultaten'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          {correct}
        </span>
        <span className="flex items-center text-red-600">
          <XCircle className="w-4 h-4 mr-1" />
          {incorrect}
        </span>
      </div>
    </div>
  );
}
