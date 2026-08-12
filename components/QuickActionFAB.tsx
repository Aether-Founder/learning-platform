'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Calendar, MessageSquare, X } from 'lucide-react';

interface QuickActionFABProps {
  onCreateStudySet?: () => void;
  onCreateEvent?: () => void;
  onCreateHomework?: () => void;
  onCreateDiscussion?: () => void;
}

export function QuickActionFAB({
  onCreateStudySet,
  onCreateEvent,
  onCreateHomework,
  onCreateDiscussion,
}: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Studie Set',
      icon: BookOpen,
      onClick: onCreateStudySet,
      color: 'bg-blue-500',
    },
    {
      label: 'Evenement',
      icon: Calendar,
      onClick: onCreateEvent,
      color: 'bg-green-500',
    },
    {
      label: 'Huiswerk',
      icon: BookOpen,
      onClick: onCreateHomework,
      color: 'bg-orange-500',
    },
    {
      label: 'Discussie',
      icon: MessageSquare,
      onClick: onCreateDiscussion,
      color: 'bg-purple-500',
    },
  ].filter((action) => action.onClick !== undefined);

  const handleActionClick = (onClick?: () => void) => {
    setIsOpen(false);
    onClick?.();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`absolute bottom-16 right-0 space-y-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        {actions.map((action, index) => (
          <div
            key={action.label}
            style={{ transitionDelay: `${index * 50}ms` }}
            className={`transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
          >
            <Button
              onClick={() => handleActionClick(action.onClick)}
              className={`${action.color} hover:opacity-90 text-white shadow-lg`}
              size="lg"
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          </div>
        ))}
      </div>

      <div className={`transition-transform duration-300 ${isOpen ? 'scale-110' : 'scale-100'}`}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200" />
          ) : (
            <Plus className="w-6 h-6 transition-transform duration-200" />
          )}
        </Button>
      </div>
    </div>
  );
}
