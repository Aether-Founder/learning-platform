"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Save, X } from "lucide-react";

interface StudyCard {
  id: string;
  term: string;
  definition: string;
  imageUrl?: string;
}

interface StudySet {
  id?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  cards: StudyCard[];
}

interface StudySetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  studySet?: StudySet;
  onSave: (studySet: Omit<StudySet, 'id'>) => Promise<void>;
}

export function StudySetEditor({ isOpen, onClose, studySet, onSave }: StudySetEditorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (studySet) {
      setTitle(studySet.title);
      setDescription(studySet.description || "");
      setIsPublic(studySet.isPublic);
      setCards(studySet.cards || []);
    } else {
      setTitle("");
      setDescription("");
      setIsPublic(false);
      setCards([{ id: crypto.randomUUID(), term: "", definition: "" }]);
    }
  }, [studySet, isOpen]);

  const addCard = () => {
    setCards([...cards, { id: crypto.randomUUID(), term: "", definition: "" }]);
  };

  const removeCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const updateCard = (index: number, field: keyof StudyCard, value: string) => {
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setCards(updatedCards);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    const validCards = cards.filter(card => card.term.trim() && card.definition.trim());
    if (validCards.length === 0) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        isPublic,
        cards: validCards,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save study set:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{studySet ? "Bewerk leerkaarten" : "Nieuwe leerkaarten"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Biologie Hoofdstuk 4"
            />
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionele beschrijving"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="isPublic">Maak openbaar</Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Kaarten ({cards.length})</Label>
              <Button size="sm" variant="outline" onClick={addCard}>
                <Plus className="w-4 h-4 mr-2" />
                Kaart toevoegen
              </Button>
            </div>

            {cards.map((card, index) => (
              <div key={card.id} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Kaart {index + 1}</span>
                  {cards.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCard(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor={`term-${index}`}>Term *</Label>
                  <Input
                    id={`term-${index}`}
                    value={card.term}
                    onChange={(e) => updateCard(index, "term", e.target.value)}
                    placeholder="Term of vraag"
                  />
                </div>

                <div>
                  <Label htmlFor={`definition-${index}`}>Definitie *</Label>
                  <Input
                    id={`definition-${index}`}
                    value={card.definition}
                    onChange={(e) => updateCard(index, "definition", e.target.value)}
                    placeholder="Definitie of antwoord"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Opslaan..." : "Opslaan"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
