export interface PacingForecast {
  targetDate: string;
  totalCards: number;
  unstudiedCards: number;
  daysRemaining: number;
  requiredNewCardsPerDay: number;
  isBehindSchedule: boolean;
  completionPercentage: number;
}

/**
 * Calculates study pacing required to complete a deck before an exam date.
 */
export function calculateExamPacing(
  totalCards: number,
  unstudiedCards: number,
  examDateIso: string,
  now = new Date()
): PacingForecast {
  const examDate = new Date(examDateIso);
  const diffMs = examDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const requiredNewCardsPerDay = Math.ceil(unstudiedCards / daysRemaining);
  const studiedCards = totalCards - unstudiedCards;
  const completionPercentage = totalCards > 0 ? Math.round((studiedCards / totalCards) * 100) : 100;

  // Flag behind schedule if required daily cards is unusually high (> 25 per day)
  const isBehindSchedule = requiredNewCardsPerDay > 25 && unstudiedCards > 0;

  return {
    targetDate: examDateIso,
    totalCards,
    unstudiedCards,
    daysRemaining,
    requiredNewCardsPerDay,
    isBehindSchedule,
    completionPercentage,
  };
}
