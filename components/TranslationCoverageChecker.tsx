'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Languages, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface LanguageCoverage {
  language: string;
  totalKeys: number;
  translatedKeys: number;
  coverage: number;
  missingKeys: string[];
}

interface TranslationCoverageCheckerProps {
  onExportReport?: () => void;
}

export function TranslationCoverageChecker({ onExportReport }: TranslationCoverageCheckerProps) {
  const [coverage, setCoverage] = useState<LanguageCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  useEffect(() => {
    fetchCoverage();
  }, []);

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/translations/coverage');
      if (response.ok) {
        const data = await response.json();
        setCoverage(data.coverage || []);
      }
    } catch (error) {
      console.error('Failed to fetch translation coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-green-500';
    if (coverage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCoverageBadge = (coverage: number) => {
    if (coverage >= 90)
      return (
        <Badge variant="default" className="bg-green-500">
          Compleet
        </Badge>
      );
    if (coverage >= 70)
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-white">
          Gedeeltelijk
        </Badge>
      );
    return <Badge variant="destructive">Onvolledig</Badge>;
  };

  const filteredCoverage =
    selectedLanguage === 'all' ? coverage : coverage.filter((c) => c.language === selectedLanguage);

  const averageCoverage =
    coverage.length > 0
      ? Math.round(coverage.reduce((sum, c) => sum + c.coverage, 0) / coverage.length)
      : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vertalingsdekking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vertalingsdekking</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{coverage.length} talen</Badge>
          <Button onClick={onExportReport} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Exporteer Rapport
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Algemene Dekking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gemiddelde Dekking</span>
              <span className={`text-2xl font-bold ${getCoverageColor(averageCoverage)}`}>
                {averageCoverage}%
              </span>
            </div>
            <Progress value={averageCoverage} className="h-3" />
            <div className="text-xs text-muted-foreground">
              {averageCoverage >= 90
                ? 'Uitstekende vertalingsdekking'
                : averageCoverage >= 70
                  ? 'Goede vertalingsdekking met ruimte voor verbetering'
                  : 'Vertalingsdekking moet worden verbeterd'}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter op Taal</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="all">Alle Talen</option>
            {coverage.map((c) => (
              <option key={c.language} value={c.language}>
                {c.language.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoverage.map((lang) => (
          <Card key={lang.language}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lang.language.toUpperCase()}</CardTitle>
                {getCoverageBadge(lang.coverage)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Dekking</span>
                  <span className={`font-semibold ${getCoverageColor(lang.coverage)}`}>
                    {lang.coverage}%
                  </span>
                </div>
                <Progress value={lang.coverage} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vertaald</span>
                <span className="font-medium">
                  {lang.translatedKeys}/{lang.totalKeys}
                </span>
              </div>

              {lang.missingKeys.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{lang.missingKeys.length} ontbrekend</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {lang.missingKeys.slice(0, 5).map((key) => (
                      <div key={key} className="text-xs text-muted-foreground truncate">
                        {key}
                      </div>
                    ))}
                    {lang.missingKeys.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{lang.missingKeys.length - 5} meer
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lang.missingKeys.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Volledig vertaald</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {coverage.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Languages className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Geen Vertalingen</h3>
            <p className="text-sm text-muted-foreground">
              Voeg vertalingen toe om de dekking te controleren
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Languages className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Over Vertalingsdekking</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Volledige dekking (90%+): Alle belangrijke teksten zijn vertaald</li>
                <li>
                  • Gedeeltelijke dekking (70-89%): Meeste teksten zijn vertaald, enkele ontbreken
                </li>
                <li>
                  • Onvolledige dekking (&lt;70%): Veel ontbrekende vertalingen, actie vereist
                </li>
                <li>• Gebruik het export rapport om ontbrekende sleutels te identificeren</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
