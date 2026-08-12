'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, Tag, Lock, Globe } from 'lucide-react';

interface ContentPreviewProps {
  content: {
    id: string;
    title: string;
    description?: string;
    type: 'study_set' | 'notes' | 'reference';
    data: any;
    tags?: string[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

export function ContentPreview({ content, onEdit, onDelete, currentUserId }: ContentPreviewProps) {
  const isOwner = currentUserId === content.userId;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study_set':
        return 'Studie Set';
      case 'notes':
        return 'Notities';
      case 'reference':
        return 'Referentie';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study_set':
        return 'bg-blue-500';
      case 'notes':
        return 'bg-green-500';
      case 'reference':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{content.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getTypeColor(content.type)}>{getTypeLabel(content.type)}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {content.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{content.isPublic ? 'Publiek' : 'Privé'}</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(content.id)}>
                  Bewerken
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(content.id)}>
                  Verwijderen
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.description && (
          <p className="text-sm text-muted-foreground">{content.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Gemaakt: {formatDate(content.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Bijgewerkt: {formatDate(content.updatedAt)}</span>
          </div>
        </div>

        {content.tags && content.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {content.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="border rounded-md p-4 bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4" />
            <span className="font-medium text-sm">Voorbeeld van inhoud</span>
          </div>
          <pre className="text-xs overflow-auto max-h-40 bg-background p-2 rounded">
            {JSON.stringify(content.data, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
