import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  AreaChart, Area, ComposedChart, Scatter, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Clock, Brain, Award, ChevronRight,
  AlertTriangle, CheckCircle, BookOpen, BarChart3, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceData {
  testResults: Array<{
    id: number;
    date: string;
    testType: string;
    score: number;
    timeSpentMinutes: number;
    topicResults: { [key: string]: number };
    subSkillResults: { [key: string]: number };
  }>;
  subSkillMastery: { [key: string]: number };
  topicMastery: { [key: string]: number };
  totalStudyTimeMinutes: number;
}

interface InteractiveInsightsDashboardProps {
  userPerformance: PerformanceData;
  testType: string;
}

const SKILL_COLORS = {
  'Reading': '#7accc8',
  'Writing': '#f26c5a', 
  'Numeracy': '#8884d8',
  'Grammar': '#ffc658',
  'Science': '#82ca9d',
  'Reasoning': '#ff7c7c'
};

export const InteractiveInsightsDashboard: React.FC<InteractiveInsightsDashboardProps> = ({
  userPerformance,
  testType
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Filter results by test type
  const filteredResults = useMemo(() => {
    return userPerformance.testResults.filter(result => result.testType === testType);
  }, [userPerformance.testResults, testType]);

  // Calculate performance trends
  const performanceTrend = useMemo(() => {
    return filteredResults.map((result, index) => ({
      test: `Test ${index + 1}`,
      score: result.score,
      time: result.timeSpentMinutes,
      date: result.date,
      efficiency: Math.round((result.score / result.timeSpentMinutes) * 10) / 10
    }));
  }, [filteredResults]);

  // Prepare radar chart data
  const skillRadarData = useMemo(() => {
    const skills = Object.keys(userPerformance.topicMastery);
    return skills.map(skill => ({
      skill,
      current: userPerformance.topicMastery[skill] || 0,
      target: 85, // Target score
      benchmark: 75 // Peer benchmark
    }));
  }, [userPerformance.topicMastery]);

  // Calculate skill improvement recommendations
  const recommendations = useMemo(() => {
    const skillScores = Object.entries(userPerformance.topicMastery);
    const weakAreas = skillScores
      .filter(([_, score]) => score < 70)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 3);
    
    const strongAreas = skillScores
      .filter(([_, score]) => score >= 85)
      .sort(([_, a], [__, b]) => b - a);

    return {
      priority: weakAreas.map(([skill, score]) => ({
        skill,
        score,
        priority: score < 50 ? 'High' : score < 70 ? 'Medium' : 'Low',
        action: score < 50 ? 'Intensive practice needed' : 'Regular practice recommended'
      })),
      strengths: strongAreas.map(([skill, score]) => ({ skill, score }))
    };
  }, [userPerformance.topicMastery]);

  // Performance statistics
  const stats = useMemo(() => {
    if (filteredResults.length === 0) return null;
    
    const scores = filteredResults.map(r => r.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const latestScore = scores[scores.length - 1];
    const trend = scores.length > 1 ? latestScore - scores[scores.length - 2] : 0;
    
    const totalTime = Math.round(userPerformance.totalStudyTimeMinutes / 60);
    const avgTime = Math.round(filteredResults.reduce((acc, r) => acc + r.timeSpentMinutes, 0) / filteredResults.length);
    
    return {
      avgScore,
      latestScore,
      trend,
      totalTests: filteredResults.length,
      totalTime,
      avgTime,
      improvement: scores.length > 1 ? latestScore - scores[0] : 0
    };
  }, [filteredResults, userPerformance.totalStudyTimeMinutes]);

  const StatCard = ({ icon, title, value, trend, subtitle, colorClass }: any) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center space-x-1 text-xs px-2 py-1 rounded-full",
                  trend > 0 ? "bg-green-100 text-green-700" : 
                  trend < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                )}>
                  {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : null}
                  <span>{Math.abs(trend)}</span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-full", colorClass)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SkillCard = ({ skill, score, isSelected, onClick }: any) => (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected ? "ring-2 ring-edu-teal shadow-md" : ""
      )}
      onClick={() => onClick(skill)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{skill}</h3>
          <Badge variant={score >= 85 ? "default" : score >= 70 ? "secondary" : "destructive"}>
            {score}%
          </Badge>
        </div>
        <Progress value={score} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Beginner</span>
          <span>Expert</span>
        </div>
      </CardContent>
    </Card>
  );

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No data available yet</p>
        <p className="text-muted-foreground">Complete some tests to see your insights!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Insights</h1>
          <p className="text-muted-foreground">Your {testType} learning analytics and recommendations</p>
        </div>
        <Button variant="outline" className="flex items-center space-x-2">
          <BookOpen size={16} />
          <span>Study Plan</span>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Award size={20} />}
          title="Average Score"
          value={`${stats.avgScore}%`}
          trend={stats.trend}
          subtitle="Latest test performance"
          colorClass="bg-edu-teal/10 text-edu-teal"
        />
        <StatCard
          icon={<Target size={20} />}
          title="Tests Completed"
          value={stats.totalTests}
          subtitle={`${stats.improvement > 0 ? '+' : ''}${stats.improvement}% since first test`}
          colorClass="bg-edu-coral/10 text-edu-coral"
        />
        <StatCard
          icon={<Clock size={20} />}
          title="Study Time"
          value={`${stats.totalTime}h`}
          subtitle={`Avg: ${stats.avgTime} min per test`}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<Brain size={20} />}
          title="Efficiency"
          value={performanceTrend.length > 0 ? `${performanceTrend[performanceTrend.length - 1]?.efficiency || 0}` : "0"}
          subtitle="Points per minute"
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skill Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Your Score"
                        dataKey="current"
                        stroke="#7accc8"
                        fill="#7accc8"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#f26c5a"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        fill="none"
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="test" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value}${name === 'score' ? '%' : name === 'time' ? ' min' : ''}`,
                          name === 'score' ? 'Score' : name === 'time' ? 'Time Spent' : 'Efficiency'
                        ]}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="score"
                        fill="#7accc8"
                        fillOpacity={0.3}
                        stroke="#7accc8"
                        strokeWidth={2}
                      />
                      <Bar yAxisId="right" dataKey="time" fill="#f26c5a" opacity={0.7} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(userPerformance.topicMastery).map(([skill, score]) => (
              <SkillCard
                key={skill}
                skill={skill}
                score={score}
                isSelected={selectedSkill === skill}
                onClick={setSelectedSkill}
              />
            ))}
          </div>

          {selectedSkill && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSkill} - Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Sub-skill Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(userPerformance.subSkillMastery)
                        .filter(([subSkill]) => subSkill.includes(selectedSkill))
                        .map(([subSkill, score]) => (
                          <div key={subSkill} className="flex items-center justify-between">
                            <span className="text-sm">{subSkill}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={score} className="w-20 h-2" />
                              <span className="text-sm font-medium w-12">{score}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Improvement Tips</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Focus on practice questions in weak sub-areas</p>
                      <p>• Review explanations for incorrect answers</p>
                      <p>• Set aside 15-20 minutes daily for this skill</p>
                      <p>• Track your progress weekly</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Detailed Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Progress Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="test" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#7accc8"
                      strokeWidth={3}
                      dot={{ r: 6, fill: "#7accc8" }}
                      activeDot={{ r: 8, fill: "#f26c5a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle size={20} className="text-orange-500" />
                  <span>Priority Areas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.priority.map(({ skill, score, priority, action }) => (
                  <div key={skill} className="p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{skill}</h4>
                      <Badge variant={priority === 'High' ? 'destructive' : 'secondary'}>
                        {priority} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{action}</p>
                    <Button size="sm" className="w-full">
                      Start Practice
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span>Your Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.strengths.map(({ skill, score }) => (
                  <div key={skill} className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{skill}</h4>
                      <Badge variant="default">{score}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Excellent work! Continue practicing to maintain this level.
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Advanced Practice
                      <Zap size={14} className="ml-1" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 