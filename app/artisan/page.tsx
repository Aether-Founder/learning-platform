'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Scan, Clock, Upload, CheckCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const supabase = browserClient as any;

type UploadState = 'IDLE' | 'UPLOADING' | 'INTAKE_ILLUSION' | 'IN_WORKSHOP' | 'COMPLETED' | 'ERROR';
type InputMode = 'file' | 'youtube';

type IntakeStep = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const INTAKE_STEPS: IntakeStep[] = [
  {
    icon: <ShieldCheck className="h-8 w-8 text-foreground" />,
    title: 'Bestand ontvangen & beveiligd',
    description: 'We versleutelen je document.',
  },
  {
    icon: <Scan className="h-8 w-8 text-foreground" />,
    title: 'Pagina\'s en concepten scannen',
    description: 'We identificeren de hoofdstukken.',
  },
  {
    icon: <Clock className="h-8 w-8 text-foreground" />,
    title: 'In de wachtrij plaatsen',
    description: 'De Artisan pakt dit z.s.m. op.',
  },
];

export default function ArtisanPage() {
  const [state, setState] = useState<UploadState>('IDLE');
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [resultDeckId, setResultDeckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    let stepInterval: NodeJS.Timeout;

    if (state === 'INTAKE_ILLUSION') {
      setCurrentStep(0);
      stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 2) {
            clearInterval(stepInterval);
            return 2;
          }
          return prev + 1;
        });
      }, 5000);
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [state]);

  useEffect(() => {
    if (state === 'INTAKE_ILLUSION' && currentStep === 2) {
      const timer = setTimeout(() => {
        setState('IN_WORKSHOP');
        subscribeToQueue();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state, currentStep]);

  const subscribeToQueue = () => {
    if (!uploadId) return;

    const subscription = supabase
      .channel(`artisan_queue:${uploadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artisan_queue',
          filter: `id=eq.${uploadId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'completed') {
            setCardCount(payload.new.card_count || 0);
            setResultDeckId(payload.new.result_deck_id);
            setState('COMPLETED');
          } else if (newStatus === 'failed') {
            setError('De Artisan kon je bestand niet lezen. Probeer een duidelijkere scan of een ander formaat.');
            setState('ERROR');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Dit manuscript is te dik voor de werkplaats (max 50MB). Splits het op in hoofdstukken.');
      setState('ERROR');
      return;
    }

    setState('UPLOADING');
    setUploadProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('artisan-inbox')
      .upload(filePath, file, {
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          setUploadProgress(percent);
        },
      });

    if (uploadError) {
      setError('Upload mislukt. Probeer het opnieuw.');
      setState('ERROR');
      return;
    }

    // Insert into artisan_queue
    const { data: queueData, error: queueError } = await supabase
      .from('artisan_queue')
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: filePath,
        file_size_bytes: file.size,
        status: 'pending',
      })
      .select()
      .single();

    if (queueError) {
      setError('Kon niet in de wachtrij plaatsen. Probeer het opnieuw.');
      setState('ERROR');
      return;
    }

    setUploadId(queueData.id);
    setState('INTAKE_ILLUSION');
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setError('Voer een geldige YouTube URL in.');
      setState('ERROR');
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('Voer een geldige YouTube URL in.');
      setState('ERROR');
      return;
    }

    setState('UPLOADING');
    setUploadProgress(50);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert into artisan_queue with YouTube URL
    const { data: queueData, error: queueError } = await supabase
      .from('artisan_queue')
      .insert({
        user_id: user.id,
        file_name: `YouTube: ${youtubeUrl}`,
        storage_path: youtubeUrl,
        file_size_bytes: 0,
        status: 'pending',
      })
      .select()
      .single();

    if (queueError) {
      setError('Kon niet in de wachtrij plaatsen. Probeer het opnieuw.');
      setState('ERROR');
      return;
    }

    setUploadProgress(100);
    setUploadId(queueData.id);
    setYoutubeUrl('');
    setState('INTAKE_ILLUSION');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: state !== 'IDLE',
  });

  const resetState = () => {
    setState('IDLE');
    setInputMode('file');
    setUploadProgress(0);
    setCurrentStep(0);
    setUploadId(null);
    setResultDeckId(null);
    setError(null);
    setCardCount(0);
    setYoutubeUrl('');
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Artisan"
        title="Artisan"
        description="De Meester van Flashcard Creatie"
      />
      <div className="mt-10 max-w-4xl mx-auto">

        {/* State Machine */}
        <AnimatePresence mode="wait">
          {state === 'IDLE' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-background rounded-2xl p-8 border border-border"
            >
              {/* Input Mode Toggle */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg border border-border p-1 bg-secondary/30">
                  <button
                    onClick={() => setInputMode('file')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      inputMode === 'file'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Bestand uploaden
                  </button>
                  <button
                    onClick={() => setInputMode('youtube')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      inputMode === 'youtube'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    YouTube URL
                  </button>
                </div>
              </div>

              {inputMode === 'file' ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-foreground/40 hover:bg-secondary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                    Geef je studiemateriaal aan de Artisan
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Wij lezen, analyseren en smeden de perfecte flashcards. Omdat kwaliteit tijd kost,
                    nemen we maximaal 24 uur de tijd voor je meesterwerk.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Accepteert: PDF, JPG, PNG, DOCX (max 50MB)
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto">
                  <div className="mb-6 text-center">
                    <Sparkles className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                      YouTube video omzetten naar flashcards
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      Plak een YouTube URL en de Artisan analyseert de video om flashcards te maken.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-foreground/40"
                    />
                    <Button
                      onClick={handleYoutubeSubmit}
                      disabled={!youtubeUrl.trim()}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Verwerk video
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {state === 'UPLOADING' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-background rounded-2xl p-8 border border-border"
            >
              <div className="text-center">
                <Upload className="mx-auto h-16 w-16 text-foreground mb-4 animate-bounce" />
                <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                  Bestand overzetten naar de werkplaats...
                </h2>
                <div className="w-full bg-secondary rounded-full h-3 mb-4">
                  <motion.div
                    className="bg-primary h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-muted-foreground">{Math.round(uploadProgress)}%</p>
              </div>
            </motion.div>
          )}

          {state === 'INTAKE_ILLUSION' && (
            <motion.div
              key="intake"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-background rounded-2xl p-8 border border-border"
            >
              <AnimatePresence mode="wait">
                {INTAKE_STEPS.map((step, index) => (
                  currentStep === index && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="text-center"
                    >
                      <div className="flex justify-center mb-6">{step.icon}</div>
                      <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                        {step.title}
                      </h2>
                      <p className="text-muted-foreground">{step.description}</p>
                      <div className="flex justify-center gap-2 mt-6">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i <= currentStep ? 'bg-primary' : 'bg-secondary'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {state === 'IN_WORKSHOP' && (
            <motion.div
              key="workshop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-background rounded-2xl p-8 border border-border"
            >
              <div className="text-center">
                <Clock className="mx-auto h-16 w-16 text-foreground mb-4 animate-pulse" />
                <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                  In de Werkplaats
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                  Je materiaal is veilig aangekomen in de werkplaats. We sturen je een notificatie zodra
                  je flashcards gesmeed zijn. Je kunt dit scherm sluiten.
                </p>
                <Button
                  variant="outline"
                  onClick={resetState}
                >
                  Sluiten
                </Button>
              </div>
            </motion.div>
          )}

          {state === 'COMPLETED' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-background rounded-2xl p-8 border border-primary/30"
            >
              <div className="text-center">
                <CheckCircle className="mx-auto h-20 w-20 text-primary mb-4" />
                <h2 className="font-display text-3xl font-semibold mb-4 text-foreground">
                  Je meesterwerk is klaar
                </h2>
                <p className="text-muted-foreground mb-6">
                  De Artisan heeft <span className="text-primary font-semibold">{cardCount}</span>{' '}
                  flashcards gesmeed.
                </p>
                {resultDeckId && (
                  <Button
                    onClick={() => router.push(`/leersets/${resultDeckId}`)}
                  >
                    Bekijk je Leerset
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {state === 'ERROR' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-background rounded-2xl p-8 border border-destructive/30"
            >
              <div className="text-center">
                <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
                <h2 className="font-display text-2xl font-semibold mb-4 text-foreground">
                  Er is iets misgegaan
                </h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={resetState} variant="outline">
                  Probeer opnieuw
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
