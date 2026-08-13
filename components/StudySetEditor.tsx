'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StudySetEditorView, type StudyCardItem } from './StudySetEditorView';

interface StudySet {
  id?: string;
  title: string;
  description?: string;
  isPublic: boolean;
  cards: StudyCardItem[];
}

interface StudySetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  studySet?: StudySet;
  onSave: (studySet: Omit<StudySet, 'id'>) => Promise<void>;
}

export function StudySetEditor({ isOpen, onClose, studySet, onSave: _onSave }: StudySetEditorProps) {

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background p-6">
        <StudySetEditorView
          isModal
          initialSetId={studySet?.id}
          initialTitle={studySet?.title || ''}
          initialDescription={studySet?.description || ''}
          initialIsPublic={studySet?.isPublic ?? true}
          initialCards={studySet?.cards || []}
          onCancel={onClose}
          onSaved={async () => {
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
