'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, BarChart3, Calendar, TrendingUp } from 'lucide-react';

interface ExportableReportsProps {
  userId: string;
}

export function ExportableReports({ userId: _userId }: ExportableReportsProps) {
  const [reportType, setReportType] = useState<
    'analytics' | 'progress' | 'achievements' | 'homework'
  >('analytics');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/reports/export?type=${reportType}&format=${format}&timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${timeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setExporting(false);
    }
  };

  const reportDescriptions = {
    analytics:
      'Volledige overzicht van je studie statistieken, inclusief tijd besteed, kaarten bestudeerd, en prestaties',
    progress: 'Gedetailleerde voortgangsrapport per vak en onderwerp',
    achievements: 'Overzicht van alle behaalde prestaties en mijlpalen',
    homework: 'Huiswerk statistieken en voltooiingspercentages',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exporteer Rapporten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rapport Type</label>
            <Select
              value={reportType}
              onValueChange={(value: 'analytics' | 'progress' | 'achievements' | 'homework') =>
                setReportType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analytics">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </div>
                </SelectItem>
                <SelectItem value="progress">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Voortgang</span>
                  </div>
                </SelectItem>
                <SelectItem value="achievements">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Prestaties</span>
                  </div>
                </SelectItem>
                <SelectItem value="homework">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Huiswerk</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{reportDescriptions[reportType]}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tijdperiode</label>
            <Select
              value={timeRange}
              onValueChange={(value: 'week' | 'month' | 'all') => setTimeRange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Deze Week</SelectItem>
                <SelectItem value="month">Deze Maand</SelectItem>
                <SelectItem value="all">Alles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Formaat</label>
            <Select
              value={format}
              onValueChange={(value: 'pdf' | 'csv' | 'json') => setFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (Leesbaar)</SelectItem>
                <SelectItem value="csv">CSV (Data)</SelectItem>
                <SelectItem value="json">JSON (API)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="w-full">
          {exporting ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-spin" />
              Exporteren...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exporteer Rapport
            </>
          )}
        </Button>

        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <h4 className="font-semibold text-sm">Beschikbare Rapporten</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span>Analytics</span>
              </div>
              <Badge variant="outline">PDF, CSV, JSON</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>Voortgang</span>
              </div>
              <Badge variant="outline">PDF, CSV, JSON</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Prestaties</span>
              </div>
              <Badge variant="outline">PDF, CSV, JSON</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Huiswerk</span>
              </div>
              <Badge variant="outline">PDF, CSV, JSON</Badge>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border">
          <h4 className="font-semibold text-sm mb-2">Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• PDF is ideaal voor afdrukken en delen met leraren</li>
            <li>• CSV is handig voor data-analyse in spreadsheets</li>
            <li>• JSON is perfect voor integratie met andere applicaties</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
