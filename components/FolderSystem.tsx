'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Folder, FolderOpen, Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

interface StudySet {
  id: string;
  title: string;
  termCount: number;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  studySets: StudySet[];
  subfolders: Folder[];
  createdAt: string;
}

interface FolderSystemProps {
  userId: string;
  onStudySetClick?: (studySetId: string) => void;
}

export function FolderSystem({ userId, onStudySetClick }: FolderSystemProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
  }, [userId]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/studysets/folders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/studysets/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: selectedParentId,
        }),
      });

      if (response.ok) {
        setNewFolderName('');
        setShowCreateDialog(false);
        setSelectedParentId(null);
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/studysets/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!editingName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/studysets/folders/${folderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingName,
        }),
      });

      if (response.ok) {
        setEditingFolder(null);
        setEditingName('');
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const totalStudySets =
      folder.studySets.length +
      folder.subfolders.reduce((sum, subfolder) => sum + countStudySetsInFolder(subfolder), 0);

    return (
      <div key={folder.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer group">
          <button onClick={() => toggleFolder(folder.id)} className="p-1 hover:bg-muted rounded">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded ? (
            <FolderOpen className="w-5 h-5 text-blue-500" />
          ) : (
            <Folder className="w-5 h-5 text-blue-500" />
          )}
          {editingFolder === folder.id ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameFolder(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameFolder(folder.id);
                if (e.key === 'Escape') {
                  setEditingFolder(null);
                  setEditingName('');
                }
              }}
              className="h-8 w-48"
              autoFocus
            />
          ) : (
            <span className="flex-1 font-medium">{folder.name}</span>
          )}
          <Badge variant="secondary" className="text-xs">
            {totalStudySets}
          </Badge>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                setEditingFolder(folder.id);
                setEditingName(folder.name);
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handleDeleteFolder(folder.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedParentId(folder.id)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe Submap</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Map naam..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button onClick={handleCreateFolder}>Aanmaken</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-1">
            {folder.studySets.map((studySet) => (
              <div
                key={studySet.id}
                className="flex items-center gap-2 p-2 pl-8 hover:bg-muted/50 rounded-lg cursor-pointer"
                onClick={() => onStudySetClick?.(studySet.id)}
              >
                <div className="w-5 h-5" />
                <span className="flex-1 text-sm">{studySet.title}</span>
                <Badge variant="outline" className="text-xs">
                  {studySet.termCount} kaarten
                </Badge>
              </div>
            ))}
            {folder.subfolders.map((subfolder) => renderFolder(subfolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const countStudySetsInFolder = (folder: Folder): number => {
    return (
      folder.studySets.length +
      folder.subfolders.reduce((sum, subfolder) => sum + countStudySetsInFolder(subfolder), 0)
    );
  };

  const rootFolders = folders.filter((f) => f.parentId === null);
  const totalStudySets = folders.reduce((sum, folder) => sum + countStudySetsInFolder(folder), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mappen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Mappen
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{rootFolders.length} mappen</Badge>
            <Badge variant="outline">{totalStudySets} sets</Badge>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Map
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe Map</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Map naam..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button onClick={handleCreateFolder}>Aanmaken</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rootFolders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Geen mappen</p>
            <p className="text-sm">Maak je eerste map om je studie sets te organiseren</p>
          </div>
        ) : (
          <div className="space-y-1">{rootFolders.map((folder) => renderFolder(folder))}</div>
        )}
      </CardContent>
    </Card>
  );
}
