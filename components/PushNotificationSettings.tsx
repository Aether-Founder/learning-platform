"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, CheckCircle2, AlertTriangle } from "lucide-react";

interface PushNotificationSettingsProps {
  userId: string;
}

export function PushNotificationSettings({ userId }: PushNotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [studyReminders, setStudyReminders] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [homeworkAlerts, setHomeworkAlerts] = useState(true);
  const [classUpdates, setClassUpdates] = useState(true);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setNotificationsEnabled(result === "granted");
    }
  };

  const sendTestNotification = () => {
    if (notificationsEnabled) {
      new Notification("Test Notificatie", {
        body: "Dit is een test notificatie van het leerplatform",
        icon: "/icon-192.png",
      });
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ingeschakeld
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <BellOff className="w-3 h-3 mr-1" />
            Geblokkeerd
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Niet Ingesteld
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Push Notificaties</h2>
        {getPermissionStatus()}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificatie Toestemming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === "default" && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Schakel notificaties in</p>
                <p className="text-sm text-muted-foreground">
                  Ontwaar notificaties voor herinneringen, prestaties en meer
                </p>
              </div>
              <Button onClick={requestPermission}>
                <Bell className="w-4 h-4 mr-2" />
                Inschakelen
              </Button>
            </div>
          )}

          {permission === "granted" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Notificaties ingeschakeld</p>
                    <p className="text-sm text-muted-foreground">
                      Je ontvangt nu push notificaties
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={sendTestNotification}>
                  Test Notificatie
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Notificatie Types</h3>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Studie Herinneringen</p>
                    <p className="text-xs text-muted-foreground">
                      Herinneringen voor studie sessies en deadlines
                    </p>
                  </div>
                  <Switch
                    checked={studyReminders}
                    onCheckedChange={setStudyReminders}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Prestatie Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Notificaties bij behaalde prestaties
                    </p>
                  </div>
                  <Switch
                    checked={achievementAlerts}
                    onCheckedChange={setAchievementAlerts}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Huiswerk Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Herinneringen voor huiswerk deadlines
                    </p>
                  </div>
                  <Switch
                    checked={homeworkAlerts}
                    onCheckedChange={setHomeworkAlerts}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Klas Updates</p>
                    <p className="text-xs text-muted-foreground">
                      Notificaties voor klas activiteiten
                    </p>
                  </div>
                  <Switch
                    checked={classUpdates}
                    onCheckedChange={setClassUpdates}
                  />
                </div>
              </div>
            </div>
          )}

          {permission === "denied" && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <BellOff className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium">Notificaties geblokkeerd</p>
                  <p className="text-sm text-muted-foreground">
                    Je hebt notificaties geblokkeerd in je browser instellingen.
                    Ga naar je browser instellingen om dit te wijzigen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Bell className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Over Push Notificaties</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ontvang herinneringen voor studie sessies en deadlines</li>
                <li>• Weet direct wanneer je een prestatie behaalt</li>
                <li>• Blijf op de hoogte van klas activiteiten</li>
                <li>• Pas aan welke notificaties je wilt ontvangen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
