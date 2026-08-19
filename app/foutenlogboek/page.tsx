'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase as browserClient } from '@/lib/supabase/client';

const supabase = browserClient as any;

type ErrorEntry = {
  id: string;
  vak: string;
  hoofdstuk: string;
  onderwerp: string;
  vraag: string;
  mijn_antwoord: string;
  correct_antwoord: string;
  fouttype: string;
  oorzaak: string;
  nieuwe_regel: string;
  herhaalstatus: 'nieuw' | 'leren' | 'herhalen' | 'beheerst';
  volgende_herhaling: string;
  datum: string;
};

const FOOTTYPES = [
  'Begripsfout',
  'Rekenfout',
  'Slordigheidsfout',
  'Verkeerde formule',
  'Verkeerde strategie',
  'Verkeerde eenheid',
  'Verkeerde notatie',
  'Verkeerde vakterm',
  'Niet goed gelezen',
  'Tijdtekort',
  'Vergeten kennis',
  'Te vaag antwoord',
  'Fout in redenering',
  'Fout in interpretatie',
  'Fout in grafiek',
  'Fout in vertaling',
  'Fout in grammatica',
  'Codefout',
  'Debugfout',
];

export default function FoutenlogboekPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    vak: '',
    hoofdstuk: '',
    onderwerp: '',
    vraag: '',
    mijn_antwoord: '',
    correct_antwoord: '',
    fouttype: '',
    oorzaak: '',
    nieuwe_regel: '',
  });

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('error_log')
      .select('*')
      .eq('user_id', user.id)
      .order('datum', { ascending: false });

    if (error) {
      console.error('Failed to fetch errors:', error);
    } else if (data) {
      setErrors(data);
    }
    setLoading(false);
  };

  const filteredErrors = filterType === 'all' 
    ? errors 
    : errors.filter(e => e.herhaalstatus === filterType);

  const handleAddError = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('error_log')
      .insert({
        user_id: user.id,
        vak: formData.vak,
        hoofdstuk: formData.hoofdstuk,
        onderwerp: formData.onderwerp,
        vraag: formData.vraag,
        mijn_antwoord: formData.mijn_antwoord,
        correct_antwoord: formData.correct_antwoord,
        fouttype: formData.fouttype,
        oorzaak: formData.oorzaak,
        nieuwe_regel: formData.nieuwe_regel,
        herhaalstatus: 'nieuw',
        volgende_herhaling: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        datum: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add error:', error);
    } else if (data) {
      setErrors([data, ...errors]);
      setShowDialog(false);
      setFormData({
        vak: '',
        hoofdstuk: '',
        onderwerp: '',
        vraag: '',
        mijn_antwoord: '',
        correct_antwoord: '',
        fouttype: '',
        oorzaak: '',
        nieuwe_regel: '',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nieuw': return 'bg-red-500/10 text-red-600';
      case 'leren': return 'bg-yellow-500/10 text-yellow-600';
      case 'herhalen': return 'bg-blue-500/10 text-blue-600';
      case 'beheerst': return 'bg-green-500/10 text-green-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nieuw': return <AlertTriangle className="h-4 w-4" />;
      case 'leren': return <Clock className="h-4 w-4" />;
      case 'herhalen': return <Clock className="h-4 w-4" />;
      case 'beheerst': return <CheckCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Foutenanalyse"
        title="Foutenlogboek"
        description="Registreer, analyseer en herhaal je fouten"
        action={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe fout
          </Button>
        }
      />

      <div className="mt-10">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Alle ({errors.length})
            </Button>
            <Button
              variant={filterType === 'nieuw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('nieuw')}
            >
              Nieuw ({errors.filter(e => e.herhaalstatus === 'nieuw').length})
            </Button>
            <Button
              variant={filterType === 'leren' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('leren')}
            >
              Leren ({errors.filter(e => e.herhaalstatus === 'leren').length})
            </Button>
            <Button
              variant={filterType === 'herhalen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('herhalen')}
            >
              Herhalen ({errors.filter(e => e.herhaalstatus === 'herhalen').length})
            </Button>
            <Button
              variant={filterType === 'beheerst' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('beheerst')}
            >
              Beheerst ({errors.filter(e => e.herhaalstatus === 'beheerst').length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : filteredErrors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Geen fouten gevonden</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {filterType === 'all' 
                ? 'Je hebt nog geen fouten geregistreerd. Begin met het toevoegen van je eerste fout.'
                : 'Geen fouten met deze status.'}
            </p>
            {filterType === 'all' && (
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Eerste fout toevoegen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((error) => (
              <div key={error.id} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${getStatusColor(error.herhaalstatus)}`}>
                      {getStatusIcon(error.herhaalstatus)}
                      {error.herhaalstatus.charAt(0).toUpperCase() + error.herhaalstatus.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">{error.datum}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{error.vak}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{error.hoofdstuk}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Vraag</p>
                    <p className="text-sm text-muted-foreground">{error.vraag}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium mb-1">Mijn antwoord</p>
                      <p className="text-sm text-red-600">{error.mijn_antwoord}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Correct antwoord</p>
                      <p className="text-sm text-green-600">{error.correct_antwoord}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Fouttype</p>
                      <p className="text-sm text-muted-foreground">{error.fouttype}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Oorzaak</p>
                      <p className="text-sm text-muted-foreground">{error.oorzaak}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Volgende herhaling</p>
                      <p className="text-sm text-muted-foreground">{error.volgende_herhaling}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/50 p-4">
                    <p className="font-medium mb-1">Nieuwe regel</p>
                    <p className="text-sm text-foreground">{error.nieuwe_regel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Error Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe fout registreren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="vak">Vak</Label>
                <Input
                  id="vak"
                  value={formData.vak}
                  onChange={(e) => setFormData({ ...formData, vak: e.target.value })}
                  placeholder="Bijv. Wiskunde B"
                />
              </div>
              <div>
                <Label htmlFor="hoofdstuk">Hoofdstuk</Label>
                <Input
                  id="hoofdstuk"
                  value={formData.hoofdstuk}
                  onChange={(e) => setFormData({ ...formData, hoofdstuk: e.target.value })}
                  placeholder="Bijv. H4"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="onderwerp">Onderwerp</Label>
              <Input
                id="onderwerp"
                value={formData.onderwerp}
                onChange={(e) => setFormData({ ...formData, onderwerp: e.target.value })}
                placeholder="Bijv. Differentiëren"
              />
            </div>
            <div>
              <Label htmlFor="vraag">Vraag of opgave</Label>
              <Textarea
                id="vraag"
                value={formData.vraag}
                onChange={(e) => setFormData({ ...formData, vraag: e.target.value })}
                placeholder="De vraag of opgave waar je de fout maakte..."
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mijn_antwoord">Mijn antwoord</Label>
                <Textarea
                  id="mijn_antwoord"
                  value={formData.mijn_antwoord}
                  onChange={(e) => setFormData({ ...formData, mijn_antwoord: e.target.value })}
                  placeholder="Wat was jouw (foute) antwoord?"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="correct_antwoord">Correct antwoord</Label>
                <Textarea
                  id="correct_antwoord"
                  value={formData.correct_antwoord}
                  onChange={(e) => setFormData({ ...formData, correct_antwoord: e.target.value })}
                  placeholder="Wat was het juiste antwoord?"
                  rows={3}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fouttype">Fouttype</Label>
              <select
                id="fouttype"
                value={formData.fouttype}
                onChange={(e) => setFormData({ ...formData, fouttype: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecteer een fouttype...</option>
                {FOOTTYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="oorzaak">Oorzaak</Label>
              <Textarea
                id="oorzaak"
                value={formData.oorzaak}
                onChange={(e) => setFormData({ ...formData, oorzaak: e.target.value })}
                placeholder="Waarom maakte je deze fout? (bijv. Ik herkende het opgavetype niet, Ik las te snel, etc.)"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="nieuwe_regel">Nieuwe regel</Label>
              <Textarea
                id="nieuwe_regel"
                value={formData.nieuwe_regel}
                onChange={(e) => setFormData({ ...formData, nieuwe_regel: e.target.value })}
                placeholder="Schrijf één concrete regel om deze fout in de toekomst te voorkomen..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddError}>
              Fout registreren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
