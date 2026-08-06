"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Clock, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Reminder {
  id: string;
  eventId: string;
  eventTitle: string;
  reminderTime: string;
  reminderType: "email" | "push" | "in-app";
  enabled: boolean;
}

interface EventRemindersProps {
  userId: string;
}

export function EventReminders({ userId }: EventRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/calendar/reminders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/calendar/reminders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled } : r))
        );
      }
    } catch (error) {
      console.error("Failed to toggle reminder:", error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/calendar/reminders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete reminder:", error);
    }
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Bell className="w-4 h-4 text-blue-500" />;
      case "push":
        return <Bell className="w-4 h-4 text-purple-500" />;
      case "in-app":
        return <Bell className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getReminderTypeBadge = (type: string) => {
    switch (type) {
      case "email":
        return <Badge variant="secondary">Email</Badge>;
      case "push":
        return <Badge variant="secondary">Push</Badge>;
      case "in-app":
        return <Badge variant="secondary">In-App</Badge>;
      default:
        return <Badge variant="secondary">Onbekend</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Herinneringen</CardTitle>
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
        <h2 className="text-2xl font-bold">Event Herinneringen</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Herinnering Toevoegen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Actieve Herinneringen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Geen herinneringen ingesteld</p>
              <p className="text-xs mt-1">Voeg herinneringen toe om nooit een event te missen</p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getReminderTypeIcon(reminder.reminderType)}
                    {getReminderTypeBadge(reminder.reminderType)}
                  </div>
                  <div>
                    <div className="font-semibold">{reminder.eventTitle}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{reminder.reminderTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Bell className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Over Herinneringen</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Email: Ontvang herinneringen via e-mail</li>
                <li>• Push: Ontvang push notificaties op je apparaat</li>
                <li>• In-App: Ontwaar herinneringen in de applicatie</li>
                <li>• Schakel herinneringen aan/uit per event</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nieuwe Herinnering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Wiskunde Toets</SelectItem>
                    <SelectItem value="2">Huiswerk Deadline</SelectItem>
                    <SelectItem value="3">Studie Sessie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Herinnering Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="in-app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tijd voor Event</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer tijd" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">5 minuten</SelectItem>
                    <SelectItem value="15min">15 minuten</SelectItem>
                    <SelectItem value="30min">30 minuten</SelectItem>
                    <SelectItem value="1hour">1 uur</SelectItem>
                    <SelectItem value="1day">1 dag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuleren
                </Button>
                <Button onClick={() => setShowAddDialog(false)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
