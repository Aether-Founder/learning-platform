'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2, Link, Copy, Check, Users, Lock, Globe, Download, QrCode } from 'lucide-react';

interface StudySetSharingProps {
  studySetId: string;
  studySetTitle: string;
  isPublic: boolean;
  onTogglePublic: () => void;
}

export function StudySetSharing({
  studySetId,
  studySetTitle,
  isPublic,
  onTogglePublic,
}: StudySetSharingProps) {
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const shareUrl = `${window.location.origin}/studyset/${studySetId}`;
  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="400" frameborder="0"></iframe>`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy embed code:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: studySetTitle,
          text: `Bekijk mijn studie set: ${studySetTitle}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Delen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Deel Studie Set
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Zichtbaarheid</h3>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">{isPublic ? 'Openbaar' : 'Privé'}</div>
                  <div className="text-sm text-muted-foreground">
                    {isPublic
                      ? 'Iedereen kan deze studie set bekijken'
                      : 'Alleen jij kunt deze studie set zien'}
                  </div>
                </div>
              </div>
              <Button onClick={onTogglePublic} variant="outline">
                {isPublic ? 'Maak Privé' : 'Maak Openbaar'}
              </Button>
            </div>
          </div>

          {isPublic && (
            <>
              <div>
                <h3 className="font-semibold mb-3">Deel Link</h3>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button onClick={handleCopyLink} variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Embed Code</h3>
                <div className="flex gap-2">
                  <Input value={embedCode} readOnly className="flex-1 font-mono text-xs" />
                  <Button onClick={handleCopyEmbed} variant="outline">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Deel Opties</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleShare} variant="outline" className="h-auto py-4">
                    <Share2 className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Delen</div>
                      <div className="text-xs text-muted-foreground">Via systeem share</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4">
                    <QrCode className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">QR Code</div>
                      <div className="text-xs text-muted-foreground">Genereer QR code</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4">
                    <Download className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Download</div>
                      <div className="text-xs text-muted-foreground">Als PDF/CSV</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-4">
                    <Users className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Klas</div>
                      <div className="text-xs text-muted-foreground">Deel met klas</div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Link className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium mb-1">Over Delen</div>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Openbare sets kunnen door iedereen worden gevonden en bekeken</li>
                      <li>• Gebruikers kunnen openbare sets kopiëren naar hun eigen account</li>
                      <li>
                        • Privé sets zijn alleen zichtbaar voor jou en mensen met wie je ze
                        expliciet deelt
                      </li>
                      <li>• Je kunt de zichtbaarheid op elk moment wijzigen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isPublic && (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium mb-1">Deel deze studie set</div>
                  <p className="text-muted-foreground">
                    Maak de studie set openbaar om deze met anderen te delen via een link of embed
                    code.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
