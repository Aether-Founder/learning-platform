'use client';

import { useState } from 'react';
import { Lightbulb, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  hint?: string;
  options: string[];
  answer: string;
  rationale?: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

interface QuizModeProps {
  quiz?: QuizData;
}

export function QuizMode({ quiz }: QuizModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [showHint, setShowHint] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Geen quiz beschikbaar.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleOptionSelect = (option: string) => {
    if (showFeedback) return; // Prevent multiple selections
    setSelectedOption(option);
    const correct = option === currentQuestion.answer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Auto-continue after showing feedback
    setTimeout(() => {
      const newAnswers = new Map(userAnswers);
      newAnswers.set(currentQuestion.id, option);
      setUserAnswers(newAnswers);
      setSelectedOption(null);
      setShowHint(false);
      setShowFeedback(false);
      setIsCorrect(false);

      if (isLastQuestion) {
        setQuizCompleted(true);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 1500); // Wait 1.5 seconds before continuing
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setShowHint(false);
    setQuizCompleted(false);
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((question) => {
      const userAnswer = userAnswers.get(question.id);
      if (userAnswer === question.answer) {
        correct++;
      }
    });
    return correct;
  };

  if (quizCompleted) {
    const score = calculateScore();
    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">{quiz.title}</h1>

          <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-6xl font-bold text-foreground mb-2">{percentage}%</p>
              <p className="text-muted-foreground">
                {score} van {total} vragen correct
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-foreground mb-4">Resultaten</h2>
          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = userAnswers.get(question.id);
              const isCorrect = userAnswer === question.answer;

              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border ${
                    isCorrect
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-2">
                        {index + 1}. {question.question}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          Jouw antwoord: {userAnswer || 'Geen antwoord'}
                        </p>
                        {!isCorrect && (
                          <p className="text-green-600 dark:text-green-400">
                            Correct antwoord: {question.answer}
                          </p>
                        )}
                        {question.rationale && (
                          <p className="text-muted-foreground mt-2 italic">{question.rationale}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRestart}
            className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Opnieuw starten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Vraag {currentQuestionIndex + 1} van {quiz.questions.length}
          </p>
        </div>

        <div className="mb-8">
          <p className="text-lg text-foreground mb-6">{currentQuestion.question}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

              let buttonClass = 'w-full text-left p-4 rounded-lg border transition-colors ';
              if (showFeedback) {
                if (option === currentQuestion.answer) {
                  buttonClass +=
                    'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
                } else if (isSelected && !isCorrect) {
                  buttonClass += 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
                } else {
                  buttonClass += 'bg-background text-foreground border-border opacity-50';
                }
              } else {
                buttonClass += isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-secondary/50';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  <span className="font-medium">{optionLetter}.</span> {option}
                </button>
              );
            })}
          </div>
        </div>

        {currentQuestion.hint && (
          <div className="mb-6">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? 'Hint verbergen' : 'Hint tonen'}
            </button>
            {showHint && (
              <div className="bg-secondary/50 border border-border rounded-lg p-4 text-sm text-foreground">
                {currentQuestion.hint}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Voortgang: {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}
