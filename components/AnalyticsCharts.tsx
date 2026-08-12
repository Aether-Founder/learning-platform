'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface WeeklyActivity {
  date: string;
  activity: number;
}

interface SubjectBreakdown {
  subject: string;
  cardsStudied: number;
  timeSpent: number;
}

interface AnalyticsChartsProps {
  weeklyActivity: WeeklyActivity[];
  subjectBreakdown: SubjectBreakdown[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AnalyticsCharts({ weeklyActivity, subjectBreakdown }: AnalyticsChartsProps) {
  const formatActivityData = () => {
    return weeklyActivity.map((day) => ({
      day: new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'short' }),
      activity: day.activity,
    }));
  };

  const formatSubjectData = () => {
    return subjectBreakdown.map((subject) => ({
      name: subject.subject,
      cards: subject.cardsStudied,
      time: subject.timeSpent,
    }));
  };

  const activityData = formatActivityData();
  const subjectData = formatSubjectData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Activity Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Wekelijkse Activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="activity" fill="#8884d8" name="Activiteit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Breakdown Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Verdeling per Studie Set</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subjectData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cards"
              >
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Time Spent Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tijd per Studie Set</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="time" fill="#82ca9d" name="Tijd (minuten)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
