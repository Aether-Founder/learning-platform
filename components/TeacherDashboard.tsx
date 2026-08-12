'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  BookOpen,
  TrendingUp,
  Plus,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface TeacherDashboardProps {
  userId: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  memberCount: number;
  pendingRequests: number;
  joinCode: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  classId: string;
  className: string;
  completedCount: number;
  totalCount: number;
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  studyTime: number;
  streak: number;
  completedAssignments: number;
  totalAssignments: number;
}

export function TeacherDashboard({ userId }: TeacherDashboardProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const [classesRes, assignmentsRes, progressRes] = await Promise.all([
        fetch('/api/classes?teacher=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/assignments?teacher=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/analytics/student-progress', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes || []);
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments || []);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setStudentProgress(progressData.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, cls) => sum + cls.memberCount, 0);
  const totalPendingRequests = classes.reduce((sum, cls) => sum + cls.pendingRequests, 0);
  const activeAssignments = assignments.filter((a) => new Date(a.dueDate) >= new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Docent Dashboard</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Klas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totale Klassen</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totale Leerlingen</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aanvragen</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actieve Opdrachten</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">Klassen</TabsTrigger>
          <TabsTrigger value="assignments">Opdrachten</TabsTrigger>
          <TabsTrigger value="students">Leerlingen</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{cls.subject}</p>
                    </div>
                    <Badge variant="secondary">{cls.grade}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Leden</span>
                    <span className="font-medium">{cls.memberCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Klascode</span>
                    <span className="font-mono font-medium">{cls.joinCode}</span>
                  </div>
                  {cls.pendingRequests > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Aanvragen</span>
                      <Badge variant="destructive">{cls.pendingRequests}</Badge>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Beheer
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Opdrachten</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Opdracht
            </Button>
          </div>
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const isOverdue = new Date(assignment.dueDate) < new Date();
              const completionRate = (assignment.completedCount / assignment.totalCount) * 100;

              return (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                            {isOverdue ? 'Verlopen' : 'Actief'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{assignment.className}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(assignment.dueDate).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.completedCount}/{assignment.totalCount} voltooid
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <h2 className="text-xl font-semibold">Leerling Voortgang</h2>
          <div className="space-y-3">
            {studentProgress.map((student) => {
              const assignmentRate =
                (student.completedAssignments / student.totalAssignments) * 100;

              return (
                <Card key={student.studentId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{student.studentName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{student.className}</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {Math.round(student.studyTime / 60)} min
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {student.streak} dagen
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(assignmentRate)}%</div>
                        <div className="text-xs text-muted-foreground">Opdrachten</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Instellingen</h2>
          <Card>
            <CardHeader>
              <CardTitle>Profiel Instellingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Naam</label>
                <input className="w-full mt-1 p-2 border rounded" type="text" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input className="w-full mt-1 p-2 border rounded" type="email" />
              </div>
              <Button>Opslaan</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
