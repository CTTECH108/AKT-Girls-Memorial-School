import { Card, CardContent } from "@/components/ui/card";

interface StatisticsProps {
  statistics?: {
    totalStudents: number;
    messagesToday: number;
    totalSent: number;
    totalFailed: number;
    totalPending: number;
    successRate: number;
    gradeDistribution: Record<number, number>;
  };
}

export function StatisticsCards({ statistics }: StatisticsProps) {
  const stats = statistics || {
    totalStudents: 0,
    messagesToday: 0,
    totalSent: 0,
    successRate: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="stats-card border-0 text-white">
        <CardContent className="p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-2c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v2h3v4H4zm14-8c-.8 0-1.5-.4-1.9-1L12 8l-4.1 1c-.4.6-1.1 1-1.9 1-1.3 0-2.4-1.1-2.4-2.4S4.7 5.2 6 5.2c.8 0 1.5.4 1.9 1L12 7l4.1-1c.4-.6 1.1-1 1.9-1 1.3 0 2.4 1.1 2.4 2.4S19.3 10 18 10z"/>
          </svg>
          <h3 className="text-3xl font-bold mb-1">{stats.totalStudents}</h3>
          <p className="text-sm opacity-90">Total Students</p>
        </CardContent>
      </Card>

      <Card className="stats-card border-0 text-white">
        <CardContent className="p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l3 3 3-3h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 9h-2v2h-2v-2H9V9h2V7h2v2h2v2z"/>
          </svg>
          <h3 className="text-3xl font-bold mb-1">{stats.messagesToday}</h3>
          <p className="text-sm opacity-90">Messages Today</p>
        </CardContent>
      </Card>

      <Card className="stats-card border-0 text-white">
        <CardContent className="p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <h3 className="text-3xl font-bold mb-1">12</h3>
          <p className="text-sm opacity-90">Grade Levels</p>
        </CardContent>
      </Card>

      <Card className="stats-card border-0 text-white">
        <CardContent className="p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <h3 className="text-3xl font-bold mb-1">{stats.successRate}%</h3>
          <p className="text-sm opacity-90">Success Rate</p>
        </CardContent>
      </Card>
    </div>
  );
}
