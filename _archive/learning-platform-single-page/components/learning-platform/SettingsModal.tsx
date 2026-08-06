"use client";

import { X, Settings } from "lucide-react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { daysUntilExam } from "@/lib/learning-platform/term-filters";
import type { QuestionType } from "@/types/learning-platform";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings, saveSettingsToStorage, resetAllProgress } =
    useLearningPlatformStore();

  if (!open) return null;

  const daysLeft = daysUntilExam(settings.examDate);
  const questionTypes: { id: QuestionType; label: string }[] = [
    { id: "multiple-choice", label: "Multiple Choice" },
    { id: "written", label: "Written" },
    { id: "true-false", label: "True/False" },
  ];

  const toggleQuestionType = (type: QuestionType) => {
    const set = new Set(settings.enabledQuestionTypes);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    if (set.size === 0) return;
    updateSettings({ enabledQuestionTypes: Array.from(set) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="settings-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <h2 id="settings-title" className="flex items-center gap-2 font-semibold">
            <Settings className="h-5 w-5" />
            Study settings
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-md hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-sm">
          <label className="block space-y-1">
            <span className="font-medium">Exam date</span>
            <input
              type="date"
              value={
                settings.examDate
                  ? new Date(settings.examDate).toISOString().slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                updateSettings({
                  examDate: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
              className="w-full rounded-md border border-border px-3 py-2 bg-background"
            />
            {daysLeft !== null && (
              <span className="text-muted-foreground text-xs">
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                {daysLeft < 3 && " — prioritizing unmastered terms"}
              </span>
            )}
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Round length: {settings.roundLength}</span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={settings.roundLength === "all" ? 50 : settings.roundLength}
              onChange={(e) => {
                const v = Number(e.target.value);
                updateSettings({ roundLength: v >= 50 ? "all" : v });
              }}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">
              {settings.roundLength === "all" ? "All terms" : `${settings.roundLength} terms`}
            </span>
          </label>

          <fieldset>
            <legend className="font-medium mb-2">Question types</legend>
            <div className="space-y-2">
              {questionTypes.map((qt) => (
                <label key={qt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabledQuestionTypes.includes(qt.id)}
                    onChange={() => toggleQuestionType(qt.id)}
                    className="rounded"
                  />
                  {qt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-medium mb-2">Question format</legend>
            <label className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="format"
                checked={settings.questionFormat === "term-to-definition"}
                onChange={() => updateSettings({ questionFormat: "term-to-definition" })}
              />
              Answer with definition
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                checked={settings.questionFormat === "definition-to-term"}
                onChange={() => updateSettings({ questionFormat: "definition-to-term" })}
              />
              Answer with term
            </label>
          </fieldset>

          <div className="space-y-3">
            {[
              ["studyStarredOnly", "Study starred only"],
              ["shuffleTerms", "Shuffle terms"],
              ["smartGrading", "Smart grading (Levenshtein ≤ 2)"],
              ["retypeAnswers", "Re-type answers on wrong"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="rounded"
                />
              </label>
            ))}
          </div>

          <fieldset className="space-y-2">
            <legend className="font-medium">Test question mix (%)</legend>
            {(["true-false", "multiple-choice", "written"] as const).map((key) => (
              <label key={key} className="flex items-center gap-2">
                <span className="w-32 capitalize">{key.replace("-", " ")}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.testQuestionDistribution?.[key] ?? 0}
                  onChange={(e) =>
                    updateSettings({
                      testQuestionDistribution: {
                        ...settings.testQuestionDistribution!,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                  className="w-20 rounded border border-border px-2 py-1"
                />
              </label>
            ))}
          </fieldset>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                saveSettingsToStorage();
                onClose();
              }}
              className="px-4 py-2 rounded-md bg-foreground text-background font-medium"
            >
              Save options
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Reset all progress for this set?")) {
                  resetAllProgress();
                }
              }}
              className="px-4 py-2 rounded-md border border-border hover:bg-secondary"
            >
              Reset progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
