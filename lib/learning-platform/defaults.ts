import type { StudySettings } from "@/types/learning-platform";

export const defaultStudySettings: StudySettings = {
  roundLength: 20,
  enabledQuestionTypes: ["multiple-choice", "written", "true-false"],
  questionFormat: "term-to-definition",
  studyStarredOnly: false,
  shuffleTerms: true,
  smartGrading: true,
  retypeAnswers: false,
  reviewMode: "mix",
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  srsAlgorithm: "sm2",
  gradingIgnoreAccents: true,
  gradingIgnoreCase: true,
  gradingIgnorePunctuation: true,
  gradingTypoTolerance: 2,
  testFeedbackMode: "exam",
  retryIncorrect: true,
  testQuestionDistribution: {
    "true-false": 25,
    "multiple-choice": 50,
    written: 25,
  },
  lerenActivity: "learn",
  lerenActivities: ["learn"],
  selectedLearningSetIds: [],
};
