import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Sparkles, Target, Trophy, Calendar, Clock, BarChart3, PieChart, CheckCircle, AlertCircle, ArrowUp, ArrowDown, Star, Award, Zap, BookOpen, Users, Play, ChevronUp, Home, Brain, Activity, MessageSquare, Calculator, PenTool, PartyPopper } from 'lucide-react';

const PerformanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [skillFilter, setSkillFilter] = useState('all');
  const [selectedTest, setSelectedTest] = useState(null);
  const [practiceSkillFilter, setPracticeSkillFilter] = useState('all');
  const [drillFilter, setDrillFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Animation trigger when tab changes
  useEffect(() => {
    setIsLoading(true);
    setAnimationKey(prev => prev + 1);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Mock data for VIC Selective Entry
  const diagnosticData = {
    overall: 74,
    sections: {
      'Reading Reasoning': 82,
      'Mathematical Reasoning': 68,
      'Verbal Reasoning': 76,
      'Quantitative Reasoning': 65,
      'Written Expression': 78
    },
    subSkills: {
      'Reading Reasoning': {
        'Reading comprehension': 85,
        'Inferential reasoning': 80,
        'Text analysis': 78,
        'Critical interpretation': 84,
        'Deductive reasoning from text': 81,
      },
      'Mathematical Reasoning': {
        'Mathematical problem solving': 70,
        'Multi-step reasoning': 65,
        'Mathematical modeling': 72,
        'Advanced numerical reasoning': 68,
        'Mathematical application': 75
      },
      'Verbal Reasoning': {
        'Pattern detection with words': 78,
        'Vocabulary reasoning': 80,
        'Word relationships': 75,
        'Letter manipulation': 70,
        'Logical word consequences': 74
      },
      'Quantitative Reasoning': {
        'Number pattern recognition': 68,
        'Mathematical sequence analysis': 58,
        'Numerical relationships': 70,
        'Word problem solving': 60,
        'Quantitative analysis': 67
      },
      'Written Expression': {
        'Creative writing': 80,
      }
    }
  };

  const practiceTestData = [
    {
      id: 1,
      overall: 69,
      date: '2024-01-15',
      sections: {
        'Reading Reasoning': 75,
        'Mathematical Reasoning': 62,
        'Verbal Reasoning': 71,
        'Quantitative Reasoning': 58,
        'Written Expression': 72
      },
      subSkills: {
        'Reading Reasoning': {
          'Reading comprehension': 78,
          'Inferential reasoning': 72,
          'Text analysis': 74,
          'Deductive reasoning from text': 73,
        },
        'Mathematical Reasoning': {
          'Mathematical problem solving': 65,
          'Mathematical modeling': 68,
          'Advanced numerical reasoning': 62,
          'Mathematical application': 70
        }
      }
    },
    {
      id: 2,
      overall: 72,
      date: '2024-01-22',
      sections: {
        'Reading Reasoning': 79,
        'Mathematical Reasoning': 65,
        'Verbal Reasoning': 74,
        'Quantitative Reasoning': 61,
        'Written Expression': 75
      },
      subSkills: {
        'Reading Reasoning': {
          'Reading comprehension': 82,
          'Text analysis': 78,
          'Critical interpretation': 80,
          'Deductive reasoning from text': 77,
        },
        'Mathematical Reasoning': {
          'Mathematical problem solving': 68,
          'Multi-step reasoning': 62,
          'Mathematical modeling': 70,
          'Mathematical application': 73
        }
      }
    },
    {
      id: 3,
      overall: 76,
      date: '2024-01-29',
      sections: {
        'Reading Reasoning': 81,
        'Mathematical Reasoning': 70,
        'Verbal Reasoning': 77,
        'Quantitative Reasoning': 67,
        'Written Expression': 78
      },
      subSkills: {
        'Reading Reasoning': {
          'Reading comprehension': 84,
          'Critical interpretation': 82,
          'Deductive reasoning from text': 80,
        }
      }
    }
  ];

  // Enhanced drill data
  const enhancedDrillData = {
    'Reading Reasoning': {
      'Reading comprehension': { completed: 15, accuracy: 82 },
      'Inferential reasoning': { completed: 0, accuracy: 0 },
      'Text analysis': { completed: 12, accuracy: 78 },
      'Critical interpretation': { completed: 6, accuracy: 80 },
      'Implicit meaning understanding': { completed: 0, accuracy: 0 },
      'Deductive reasoning from text': { completed: 3, accuracy: 79 },
      'Academic knowledge application': { completed: 0, accuracy: 0 }
    },
    'Mathematical Reasoning': {
      'Mathematical problem solving': { completed: 8, accuracy: 72 },
      'Multi-step reasoning': { completed: 12, accuracy: 68 },
      'Complex mathematical concepts': { completed: 0, accuracy: 0 },
      'Mathematical modeling': { completed: 9, accuracy: 71 },
      'Advanced numerical reasoning': { completed: 15, accuracy: 65 },
      'Spatial problem solving': { completed: 0, accuracy: 0 },
      'Mathematical application': { completed: 0, accuracy: 0 }
    },
    'Verbal Reasoning': {
      'Pattern detection with words': { completed: 10, accuracy: 76 },
      'Word relationships': { completed: 8, accuracy: 73 },
      'Vocabulary reasoning': { completed: 6, accuracy: 82 },
      'Odd word identification': { completed: 0, accuracy: 0 },
      'Word meaning analysis': { completed: 0, accuracy: 0 },
      'Letter manipulation': { completed: 4, accuracy: 68 },
      'Logical word consequences': { completed: 0, accuracy: 0 }
    },
    'Quantitative Reasoning': {
      'Number pattern recognition': { completed: 12, accuracy: 70 },
      'Quantitative problem solving': { completed: 0, accuracy: 0 },
      'Mathematical sequence analysis': { completed: 18, accuracy: 62 },
      'Numerical relationships': { completed: 5, accuracy: 74 },
      'Word problem solving': { completed: 15, accuracy: 65 },
      'Mathematical reasoning': { completed: 0, accuracy: 0 },
      'Quantitative analysis': { completed: 8, accuracy: 63 }
    },
    'Written Expression': {
      'Creative writing': { completed: 3, accuracy: 78 },
      'Analytical writing': { completed: 0, accuracy: 0 }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-500';
  };

  const getScoreColorSVG = (score) => {
    if (score >= 80) return '#059669'; // emerald-600
    if (score >= 60) return '#ea580c'; // orange-600
    return '#ef4444'; // red-500
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100';
    if (score >= 60) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-orange-100';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-red-100';
  };

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (score >= 60) return 'bg-gradient-to-r from-orange-500 to-amber-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  const getBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Animated Progress Bar Component
  const AnimatedProgressBar = ({ value, className = "", delay = 0 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, delay);
      return () => clearTimeout(timer);
    }, [value, delay]);

    return (
      <div className={`bg-slate-200 rounded-full h-3 relative overflow-hidden ${className}`}>
        <div 
          className={`h-3 rounded-full transition-all duration-1000 ease-out ${getBarColor(value)}`}
          style={{ width: `${animatedValue}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
        </div>
      </div>
    );
  };

  // Enhanced Filter Button Component
  const FilterButton = ({ active, onClick, children, count }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out transform hover:scale-105 hover:shadow-lg ${
        active
          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span>{children}</span>
        {count !== undefined && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            active ? 'bg-white/20' : 'bg-slate-100'
          }`}>
            {count}
          </span>
        )}
      </div>
    </button>
  );

  // Enhanced Card Component
  const Card = ({ children, className = "", hover = true, glow = false }) => (
    <div className={`
      bg-white rounded-2xl border border-slate-200 shadow-lg
      ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
      ${glow ? 'shadow-teal-100' : ''}
      transition-all duration-300 ease-out
      ${className}
    `}>
      {children}
    </div>
  );

  const getAllSubSkillsRanked = () => {
    const allSkills = [];
    Object.entries(diagnosticData.subSkills).forEach(([section, skills]) => {
      Object.entries(skills).forEach(([skill, score]) => {
        allSkills.push({ skill, score, section });
      });
    });
    return allSkills.sort((a, b) => b.score - a.score);
  };

  const getFilteredSkills = () => {
    const allSkills = getAllSubSkillsRanked();
    
    if (skillFilter === 'all') {
      return allSkills;
    }
    
    return allSkills.filter(item => item.section === skillFilter);
  };

  const getPriorityAreas = () => {
    return getAllSubSkillsRanked().filter(item => item.score < 60).slice(0, 3);
  };

  const getStrengths = () => {
    return getAllSubSkillsRanked().filter(item => item.score >= 80).slice(0, 3);
  };

  // New helper functions for Sub-skill Overview
  const getTopSubSkills = () => {
    return getAllSubSkillsRanked().slice(0, 5);
  };

  const getBottomSubSkills = () => {
    const allSkills = getAllSubSkillsRanked();
    return allSkills.slice(-5).reverse(); // Get bottom 5 and reverse to show lowest first
  };

  const getTotalDrillsCompleted = () => {
    let total = 0;
    Object.values(enhancedDrillData).forEach(section => {
      Object.values(section).forEach(skill => {
        total += skill.completed;
      });
    });
    return total;
  };

  const getOverallDrillAccuracy = () => {
    let totalAccuracy = 0;
    let skillCount = 0;
    Object.values(enhancedDrillData).forEach(section => {
      Object.values(section).forEach(skill => {
        totalAccuracy += skill.accuracy;
        skillCount++;
      });
    });
    return skillCount > 0 ? Math.round(totalAccuracy / skillCount) : 0;
  };

  const getFilteredDrills = () => {
    const allDrills = [];
    Object.entries(enhancedDrillData).forEach(([section, skills]) => {
      Object.entries(skills).forEach(([skill, data]) => {
        allDrills.push({ skill, section, ...data });
      });
    });
    
    const sortedDrills = allDrills.sort((a, b) => b.completed - a.completed);
    
    if (drillFilter === 'all') {
      return sortedDrills;
    }
    
    return sortedDrills.filter(item => item.section === drillFilter);
  };

  const getSectionDrillTotals = () => {
    const sectionTotals = {};
    Object.entries(enhancedDrillData).forEach(([section, skills]) => {
      let totalCompleted = 0;
      let totalAccuracy = 0;
      let skillCount = 0;
      
      Object.values(skills).forEach(skill => {
        totalCompleted += skill.completed;
        totalAccuracy += skill.accuracy;
        skillCount++;
      });
      
      sectionTotals[section] = {
        completed: totalCompleted,
        averageAccuracy: skillCount > 0 ? Math.round(totalAccuracy / skillCount) : 0
      };
    });
    return sectionTotals;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up' || trend === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (trend === 'down' || trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  // Overview calculations
  const getOverviewMetrics = () => {
    const diagnosticQuestions = Object.values(diagnosticData.subSkills).reduce((total, section) => 
      total + Object.keys(section).length * 5, 0);
    
    const practiceQuestions = practiceTestData.reduce((total, test) => {
      return total + Object.values(test.sections).length * 8;
    }, 0);
    
    const drillQuestions = getTotalDrillsCompleted();
    const totalQuestions = diagnosticQuestions + practiceQuestions + drillQuestions;
    
    const allSectionScores = [];
    
    Object.values(diagnosticData.sections).forEach(score => allSectionScores.push(score));
    
    practiceTestData.forEach(test => {
      Object.values(test.sections).forEach(score => allSectionScores.push(score));
    });
    
    Object.entries(enhancedDrillData).forEach(([section, skills]) => {
      const sectionAccuracies = Object.values(skills).map(skill => skill.accuracy);
      const avgSectionAccuracy = sectionAccuracies.reduce((sum, acc) => sum + acc, 0) / sectionAccuracies.length;
      allSectionScores.push(avgSectionAccuracy);
    });
    
    const averagePerformance = Math.round(
      allSectionScores.reduce((sum, score) => sum + score, 0) / allSectionScores.length
    );
    
    return {
      totalQuestions,
      averagePerformance
    };
  };

  const getCombinedSectionPerformance = () => {
    const sectionNames = Object.keys(diagnosticData.sections);
    const combinedPerformance: Record<string, { averageScore: number; totalQuestions: number; trend: string }> = {};
    
    sectionNames.forEach(section => {
      const scores = [];
      let totalQuestions = 0;
      
      scores.push(diagnosticData.sections[section]);
      totalQuestions += Object.keys(diagnosticData.subSkills[section] || {}).length * 5;
      
      practiceTestData.forEach(test => {
        if (test.sections[section]) {
          scores.push(test.sections[section]);
          totalQuestions += 8;
        }
      });
      
      if (enhancedDrillData[section]) {
        const drillSkills = enhancedDrillData[section];
        const drillScores = Object.values(drillSkills).map((skill: any) => skill.accuracy);
        const drillQuestions = Object.values(drillSkills).reduce((sum: number, skill: any) => sum + skill.completed, 0) as number;
        
        scores.push(...drillScores);
        totalQuestions += drillQuestions;
      }
      
      const averageScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
      
      combinedPerformance[section] = {
        averageScore,
        totalQuestions,
        trend: getTrendForSection(section)
      };
    });
    
    return combinedPerformance;
  };

  const getTrendForSection = (section) => {
    const diagnosticScore = diagnosticData.sections[section];
    const latestPracticeTest = practiceTestData[practiceTestData.length - 1];
    
    if (!latestPracticeTest || !latestPracticeTest.sections[section]) {
      return 'stable';
    }
    
    const latestScore = latestPracticeTest.sections[section];
    const difference = latestScore - diagnosticScore;
    
    if (difference >= 5) return 'improving';
    if (difference <= -5) return 'declining';
    return 'stable';
  };

  const getOverviewStrengths = () => {
    const combinedPerformance = getCombinedSectionPerformance();
    return Object.entries(combinedPerformance)
      .filter(([_, data]) => data.averageScore >= 80)
      .sort((a, b) => b[1].averageScore - a[1].averageScore)
      .slice(0, 3);
  };

  const getOverviewWeaknesses = () => {
    const combinedPerformance = getCombinedSectionPerformance();
    return Object.entries(combinedPerformance)
      .filter(([_, data]) => data.averageScore < 60)
      .sort((a, b) => a[1].averageScore - b[1].averageScore)
      .slice(0, 3);
  };

  const renderOverview = () => {
    const metrics = getOverviewMetrics();
    const sectionPerformance = getCombinedSectionPerformance();
    
    return (
      <div className="space-y-8" key={`overview-${animationKey}`}>
        {/* Hero Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-gradient-to-br from-teal-50 via-teal-50 to-cyan-50 border-teal-200" glow>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-teal-900">Total Questions Completed</h3>
                <p className="text-sm text-teal-700 opacity-80">Across Diagnostic, Drills & Practice Tests</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-teal-600 mb-1">{metrics.totalQuestions}</div>
                <div className="text-sm text-teal-600 font-medium">questions</div>
              </div>
            </div>
          </Card>

          <Card className={`p-8 ${getScoreBg(metrics.averagePerformance)} shadow-xl`}>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Overall Accuracy</h3>
                <p className="text-sm text-slate-600 opacity-80">Across Diagnostic, Drills & Practice Tests</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${getScoreColor(metrics.averagePerformance)} mb-1`}>
                  {metrics.averagePerformance}%
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Section Performance Spider Chart */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Overall Performance by Test Section</h3>
          <SpiderChart data={Object.fromEntries(
            Object.entries(sectionPerformance).map(([section, data]) => [section, data.averageScore])
          )} size={400} />
        </Card>

        {/* Sub-skill Overview */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Overall Sub-Skill Strengths & Weaknesses</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200" hover={false}>
              <div className="flex items-center space-x-3 mb-6">
                <h4 className="text-lg font-bold text-teal-900 mb-6">Top 5 Sub-skills</h4>
              </div>
              <div className="space-y-3">
                {getCombinedTopSubSkills().map((item, index) => (
                  <div key={index} 
                       className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-teal-200/50 hover:bg-white/80 transition-all duration-300"
                       style={{ animationDelay: `${index * 150}ms` }}>
                    <div>
                      <div className="text-sm font-bold text-teal-800">{item.skill}</div>
                      <div className="text-xs text-teal-600">{item.section}</div>
                    </div>
                    <span className={`font-black text-lg ${getScoreColorWithDash(item.averageScore, item.skill, item.section)}`}>
                      {formatScoreDisplay(item.averageScore, item.skill, item.section)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200" hover={false}>
              <div className="flex items-center space-x-3 mb-6">
                <h4 className="text-lg font-bold text-red-900 mb-6">Bottom 5 Sub-skills</h4>
              </div>
              <div className="space-y-3">
                {getCombinedBottomSubSkills().map((item, index) => (
                  <div key={index} 
                       className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-red-200/50 hover:bg-white/80 transition-all duration-300"
                       style={{ animationDelay: `${index * 150}ms` }}>
                    <div>
                      <div className="text-sm font-bold text-red-800">{item.skill}</div>
                      <div className="text-xs text-red-600">{item.section}</div>
                    </div>
                    <span className={`font-black text-lg ${getScoreColorWithDash(item.averageScore, item.skill, item.section)}`}>
                      {formatScoreDisplay(item.averageScore, item.skill, item.section)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Card>

        {/* Skills Performance with Enhanced Filters */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Overall Sub-Skill Performance</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterButton 
              active={skillFilter === 'all'} 
              onClick={() => setSkillFilter('all')}
              count={getCombinedFilteredSkills().length}
            >
              All Skills
            </FilterButton>
            {Object.keys(diagnosticData.sections).map((section) => (
              <FilterButton
                key={section}
                active={skillFilter === section}
                onClick={() => setSkillFilter(section)}
                count={getCombinedFilteredSkills().filter(skill => skill.section === section).length}
              >
                {section.split(' ')[0]}
              </FilterButton>
            ))}
          </div>
          
          {/* Show section score if filtered */}
          {skillFilter !== 'all' && sectionPerformance[skillFilter] && (
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{skillFilter}</span>
                <span className={`text-xl font-black ${getScoreColor(sectionPerformance[skillFilter].averageScore)}`}>
                  {sectionPerformance[skillFilter].averageScore}%
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {getCombinedFilteredSkills().map((item, index) => (
              <div key={index} 
                   className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                   style={{ animationDelay: `${index * 50}ms` }}>
                <div className="w-64 text-sm text-slate-700 font-medium truncate" title={item.skill}>
                  {item.skill}
                </div>
                {skillFilter === 'all' && (
                  <div className="w-36 text-xs text-slate-500 truncate font-medium">
                    {item.section}
                  </div>
                )}
                <div className="w-32 text-xs text-slate-400 font-medium">
                  {getDiagnosticQuestionsCompleted(item.skill, item.section)} questions completed
                </div>
                <div className="flex-1">
                  {shouldShowProgressBar(item.skill, item.section) ? (
                    <AnimatedProgressBar value={item.averageScore} delay={index * 100} />
                  ) : (
                    <div className="bg-slate-100 rounded-full h-3">
                      <div className="h-3 rounded-full bg-slate-200 w-full opacity-50"></div>
                    </div>
                  )}
                </div>
                <div className={`w-16 text-sm font-bold text-right ${getScoreColorWithDash(item.score, item.skill, item.section)}`}>
                  {formatScoreDisplay(item.score, item.skill, item.section)}
                </div>
                <button 
                  className="bg-gradient-to-r from-slate-600 to-gray-600 text-white px-4 py-2 text-sm rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  onClick={() => {/* Handle drill start */}}
                >
                  Drill
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // Enhanced Spider Chart Component with animations
  const SpiderChart = ({ data, size = 300 }) => {
    const [animationProgress, setAnimationProgress] = useState(0);
    const sections = Object.keys(data);
    const scores = Object.values(data).map(score => Number(score));
    const center = size / 2;
    const radius = size / 2 - 50;
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 300);
      return () => clearTimeout(timer);
    }, [data]);

    const points = sections.map((_, index) => {
      const angle = (index * 2 * Math.PI) / sections.length - Math.PI / 2;
      const score = (scores[index] / 100) * animationProgress;
      const x = center + radius * score * Math.cos(angle);
      const y = center + radius * score * Math.sin(angle);
      return { x, y, angle, score: scores[index] };
    });

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return (
      <div className="flex justify-center p-6">
        <svg width={size} height={size} className="overflow-visible drop-shadow-sm">
          {/* Grid circles with subtle animation */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
            <circle
              key={scale}
              cx={center}
              cy={center}
              r={radius * scale * animationProgress}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              className="transition-all duration-1000 ease-out"
            />
          ))}
          
          {/* Grid lines */}
          {sections.map((_, index) => {
            const angle = (index * 2 * Math.PI) / sections.length - Math.PI / 2;
            const x = center + radius * Math.cos(angle) * animationProgress;
            const y = center + radius * Math.sin(angle) * animationProgress;
            return (
              <line
                key={index}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
          
          {/* Data polygon with drawing animation */}
          <path
            d={pathData}
            fill="rgba(20, 184, 166, 0.15)"
            stroke="#14b8a6"
            strokeWidth="3"
            className="transition-all duration-1500 ease-out"
            style={{
              strokeDasharray: animationProgress === 0 ? '1000' : '0',
              strokeDashoffset: animationProgress === 0 ? '1000' : '0'
            }}
          />
          
          {/* Data points with staggered animation */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#14b8a6"
              className="transition-all duration-500 ease-out hover:r-8 cursor-pointer"
              style={{
                animationDelay: `${index * 200 + 800}ms`,
                transform: animationProgress === 0 ? 'scale(0)' : 'scale(1)'
              }}
            />
          ))}
          
          {/* Labels with enhanced styling */}
          {sections.map((section, index) => {
            const angle = (index * 2 * Math.PI) / sections.length - Math.PI / 2;
            const labelRadius = radius + 35;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            const scoreValue = scores[index];
            
            return (
              <g key={index} className="transition-all duration-300 ease-out">
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-slate-700"
                  style={{
                    transform: `translate(${x < center ? '-30px' : x > center ? '30px' : '0'}, 0)`
                  }}
                >
                  {section.split(' ')[0]}
                </text>
                <text
                  x={x}
                  y={y + 16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-slate-600"
                  style={{
                    transform: `translate(${x < center ? '-30px' : x > center ? '30px' : '0'}, 0)`
                  }}
                >
                  {section.split(' ').slice(1).join(' ')}
                </text>
                <text
                  x={x}
                  y={y + 34}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-black"
                  fill={getScoreColorSVG(scoreValue)}
                  style={{
                    transform: `translate(${x < center ? '-30px' : x > center ? '30px' : '0'}, 0)`
                  }}
                >
                  {scoreValue}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderDiagnostic = () => (
    <div className="space-y-8" key={`diagnostic-${animationKey}`}>
      {/* Overall Score */}
      <Card className={`p-8 ${getScoreBg(diagnosticData.overall)} shadow-xl`}>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Diagnostic Test Performance</h3>
            <p className="text-sm text-slate-600 opacity-80">VIC Selective Entry Diagnostic</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${getScoreColor(diagnosticData.overall)} mb-1`}>
              {diagnosticData.overall}%
            </div>
          </div>
        </div>
      </Card>

      {/* Spider Chart */}
      <Card className="p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Diagnostic Performance by Test Section</h3>
        <SpiderChart data={diagnosticData.sections} size={400} />
      </Card>

      {/* Sub-skill Overview */}
      <Card className="p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Diagnostic Sub-Skill Strengths & Weaknesses</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200" hover={false}>
            <div className="flex items-center space-x-3 mb-6">
              <h4 className="text-lg font-bold text-teal-900 mb-6">Top 5 Sub-skills</h4>
            </div>
            <div className="space-y-3">
              {getTopSubSkills().map((item, index) => (
                <div key={index} 
                     className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-teal-200/50 hover:bg-white/80 transition-all duration-300"
                     style={{ animationDelay: `${index * 150}ms` }}>
                  <div>
                    <div className="text-sm font-bold text-teal-800">{item.skill}</div>
                    <div className="text-xs text-teal-600">{item.section}</div>
                  </div>
                  <span className={`font-black text-lg ${getScoreColorWithDash(item.score, item.skill, item.section)}`}>
                    {formatScoreDisplay(item.score, item.skill, item.section)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200" hover={false}>
            <div className="flex items-center space-x-3 mb-6">
              <h4 className="text-lg font-bold text-red-900 mb-6">Bottom 5 Sub-skills</h4>
            </div>
            <div className="space-y-3">
              {getBottomSubSkills().map((item, index) => (
                <div key={index} 
                     className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-red-200/50 hover:bg-white/80 transition-all duration-300"
                     style={{ animationDelay: `${index * 150}ms` }}>
                  <div>
                    <div className="text-sm font-bold text-red-800">{item.skill}</div>
                    <div className="text-xs text-red-600">{item.section}</div>
                  </div>
                  <span className={`font-black text-lg ${getScoreColorWithDash(item.score, item.skill, item.section)}`}>
                    {formatScoreDisplay(item.score, item.skill, item.section)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>

      {/* Skills Performance with Enhanced Filters */}
      <Card className="p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Diagnostic Sub-Skill Performance</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterButton 
            active={skillFilter === 'all'} 
            onClick={() => setSkillFilter('all')}
            count={getAllSubSkillsRanked().length}
          >
            All Skills
          </FilterButton>
          {Object.keys(diagnosticData.sections).map((section) => (
            <FilterButton
              key={section}
              active={skillFilter === section}
              onClick={() => setSkillFilter(section)}
              count={Object.keys(diagnosticData.subSkills[section] || {}).length}
            >
              {section.split(' ')[0]}
            </FilterButton>
          ))}
        </div>
        
        {/* Show section score if filtered */}
        {skillFilter !== 'all' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">{skillFilter}</span>
              <span className={`text-xl font-black ${getScoreColor(diagnosticData.sections[skillFilter])}`}>
                {diagnosticData.sections[skillFilter]}%
              </span>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {getFilteredSkills().map((item, index) => (
            <div key={index} 
                 className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                 style={{ animationDelay: `${index * 50}ms` }}>
              <div className="w-64 text-sm text-slate-700 font-medium truncate" title={item.skill}>
                {item.skill}
              </div>
              {skillFilter === 'all' && (
                <div className="w-36 text-xs text-slate-500 truncate font-medium">
                  {item.section}
                </div>
              )}
              <div className="w-32 text-xs text-slate-400 font-medium">
                {getDiagnosticQuestionsCompleted(item.skill, item.section)} questions completed
              </div>
              <div className="flex-1">
                {shouldShowProgressBar(item.skill, item.section) ? (
                  <AnimatedProgressBar value={item.averageScore} delay={index * 100} />
                ) : (
                  <div className="bg-slate-100 rounded-full h-3">
                    <div className="h-3 rounded-full bg-slate-200 w-full opacity-50"></div>
                  </div>
                )}
              </div>
              <div className={`w-16 text-sm font-bold text-right ${getScoreColorWithDash(item.score, item.skill, item.section)}`}>
                {formatScoreDisplay(item.score, item.skill, item.section)}
              </div>
              <button 
                className="bg-gradient-to-r from-slate-600 to-gray-600 text-white px-4 py-2 text-sm rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                onClick={() => {/* Handle drill start */}}
              >
                Drill
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const getSelectedTestData = () => {
    if (!selectedTest) return null;
    return practiceTestData.find(test => test.id === selectedTest);
  };

  const getPracticeFilteredSkills = (testData) => {
    if (!testData || !testData.subSkills) return [];
    
    const allSkills = [];
    Object.entries(testData.subSkills).forEach(([section, skills]) => {
      Object.entries(skills).forEach(([skill, score]) => {
        allSkills.push({ skill, score, section });
      });
    });
    
    const sortedSkills = allSkills.sort((a, b) => b.score - a.score);
    
    if (practiceSkillFilter === 'all') {
      return sortedSkills;
    }
    
    return sortedSkills.filter(item => item.section === practiceSkillFilter);
  };

  const getProgressTrendData = () => {
    const sectionNames = Object.keys(diagnosticData.sections);
    const trendData = {};
    
    sectionNames.forEach(section => {
      trendData[section] = practiceTestData.map(test => ({
        testId: test.id,
        score: test.sections[section],
        date: test.date
      }));
    });
    
    return trendData;
  };

  const renderPracticeTests = () => {
    const selectedTestData = getSelectedTestData();
    const trendData = getProgressTrendData();
    
    return (
      <div className="space-y-8" key={`practice-${animationKey}`}>
        {/* Test Selection */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Select Practice Test</h3>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((testNum) => {
              const test = practiceTestData.find(t => t.id === testNum);
              return (
                <button
                  key={testNum}
                  onClick={() => setSelectedTest(test ? testNum : null)}
                  disabled={!test}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 transform hover:scale-105 ${
                    test 
                      ? selectedTest === testNum
                        ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-teal-100 shadow-lg shadow-teal-200'
                        : `${getScoreBg(test.overall)} hover:border-teal-300 hover:shadow-lg`
                      : 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-600 mb-2">Test {testNum}</div>
                  {test ? (
                    <>
                      <div className={`text-3xl font-black ${getScoreColor(test.overall)} mb-2`}>
                        {test.overall}%
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{test.date}</div>
                    </>
                  ) : (
                    <div className="text-slate-400 text-sm mt-4 font-medium">Not Started</div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Test Analysis */}
        {selectedTestData && (
          <>
            {/* Test Overview */}
            <Card className={`p-8 ${getScoreBg(selectedTestData.overall)} shadow-xl`}>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Practice Test {selectedTestData.id} Performance</h3>
                  <p className="text-sm text-slate-600 opacity-80">Completed on {selectedTestData.date}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${getScoreColor(selectedTestData.overall)} mb-2`}>
                    {selectedTestData.overall}%
                  </div>
                </div>
              </div>
            </Card>

            {/* Section Spider Chart */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Practice Test {selectedTestData.id}: Performance by Test Section
              </h3>
              <SpiderChart data={selectedTestData.sections} size={400} />
            </Card>

            {/* Skills Performance with Filters */}
            {selectedTestData.subSkills && Object.keys(selectedTestData.subSkills).length > 0 && (
              <Card className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Practice Test {selectedTestData.id}: Sub-Skill Performance
                </h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  <FilterButton
                    active={practiceSkillFilter === 'all'}
                    onClick={() => setPracticeSkillFilter('all')}
                    count={getPracticeFilteredSkills(selectedTestData).length}
                  >
                    All Skills
                  </FilterButton>
                  {Object.keys(selectedTestData.subSkills).map((section) => (
                    <FilterButton
                      key={section}
                      active={practiceSkillFilter === section}
                      onClick={() => setPracticeSkillFilter(section)}
                      count={Object.keys(selectedTestData.subSkills[section] || {}).length}
                    >
                      {section.split(' ')[0]}
                    </FilterButton>
                  ))}
                </div>
                
                {/* Show section score if filtered */}
                {practiceSkillFilter !== 'all' && selectedTestData.sections[practiceSkillFilter] && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{practiceSkillFilter}</span>
                      <span className={`text-xl font-black ${getScoreColor(selectedTestData.sections[practiceSkillFilter])}`}>
                        {selectedTestData.sections[practiceSkillFilter]}%
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {getPracticeFilteredSkills(selectedTestData).map((item, index) => (
                    <div key={index} 
                         className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                         style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="w-64 text-sm text-slate-700 font-medium truncate" title={item.skill}>
                        {item.skill}
                      </div>
                      {practiceSkillFilter === 'all' && (
                        <div className="w-36 text-xs text-slate-500 truncate font-medium">
                          {item.section}
                        </div>
                      )}
                      <div className="w-32 text-xs text-slate-400 font-medium">
                        8 questions completed
                      </div>
                      <div className="flex-1">
                        {shouldShowProgressBar(item.skill, item.section) ? (
                          <AnimatedProgressBar value={item.averageScore} delay={index * 100} />
                        ) : (
                          <div className="bg-slate-100 rounded-full h-3">
                            <div className="h-3 rounded-full bg-slate-200 w-full opacity-50"></div>
                          </div>
                        )}
                      </div>
                      <div className={`w-16 text-sm font-bold text-right ${getScoreColorWithDash(item.score, item.skill, item.section)}`}>
                        {formatScoreDisplay(item.score, item.skill, item.section)}
                      </div>
                      <button 
                        className="bg-gradient-to-r from-slate-600 to-gray-600 text-white px-4 py-2 text-sm rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                        onClick={() => {/* Handle drill start */}}
                      >
                        Drill
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Placeholder when no test selected */}
        {!selectedTestData && (
          <Card className="p-16 text-center border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50">
            <div className="text-slate-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Select a Practice Test</h3>
              <p className="text-sm">Choose a completed practice test above to view detailed performance analysis</p>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderDrills = () => {
    return (
      <div className="space-y-8" key={`drills-${animationKey}`}>
        {/* Drill Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-gradient-to-br from-teal-50 via-teal-50 to-cyan-50 border-teal-200" glow>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-teal-900">Total Questions Completed</h3>
                <p className="text-sm text-teal-700 opacity-80">Drill questions only</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-teal-600 mb-1">{getTotalDrillsCompleted()}</div>
                <div className="text-sm text-teal-600 font-medium">questions</div>
              </div>
            </div>
          </Card>

          <Card className={`p-8 ${getScoreBg(getOverallDrillAccuracy())} shadow-xl`}>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Overall Accuracy</h3>
                <p className="text-sm text-slate-600 opacity-80">Drill questions only</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${getScoreColor(getOverallDrillAccuracy())} mb-1`}>
                  {getOverallDrillAccuracy()}%
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Drill Performance */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Drill Sub-Skill Performance</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterButton
              active={drillFilter === 'all'}
              onClick={() => setDrillFilter('all')}
              count={getFilteredDrills().length}
            >
              All Skills
            </FilterButton>
            {Object.keys(getSectionDrillTotals()).map((section) => (
              <FilterButton
                key={section}
                active={drillFilter === section}
                onClick={() => setDrillFilter(section)}
                count={getFilteredDrills().filter(drill => drill.section === section).length}
              >
                {section.split(' ')[0]}
              </FilterButton>
            ))}
          </div>
          
          {/* Show section score if filtered */}
          {drillFilter !== 'all' && getSectionDrillTotals()[drillFilter] && (
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{drillFilter}</span>
                <span className={`text-xl font-black ${getScoreColor(getSectionDrillTotals()[drillFilter])}`}>
                  {getSectionDrillTotals()[drillFilter]}%
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {getFilteredDrills().map((drill, index) => (
              <div key={index} 
                   className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                   style={{ animationDelay: `${index * 50}ms` }}>
                <div className="w-64 text-sm text-slate-700 font-medium truncate" title={drill.skill}>
                  {drill.skill}
                </div>
                {drillFilter === 'all' && (
                  <div className="w-36 text-xs text-slate-500 truncate font-medium">
                    {drill.section}
                  </div>
                )}
                <div className="w-32 text-xs text-slate-400 font-medium">
                  {drill.completed} questions completed
                </div>
                <div className="flex-1">
                  {shouldShowDrillProgressBar(drill) ? (
                    <AnimatedProgressBar value={drill.accuracy} delay={index * 100} />
                  ) : (
                    <div className="bg-slate-100 rounded-full h-3">
                      <div className="h-3 rounded-full bg-slate-200 w-full opacity-50"></div>
                    </div>
                  )}
                </div>
                <div className={`w-16 text-sm font-bold text-right ${getDrillScoreColorWithDash(drill)}`}>
                  {formatDrillScoreDisplay(drill)}
                </div>
                <button 
                  className="bg-gradient-to-r from-slate-600 to-gray-600 text-white px-4 py-2 text-sm rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  onClick={() => {/* Handle drill start */}}
                >
                  Drill
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Priority Recommendations */}
        <Card className="p-8 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Priority Recommendations</h3>
          <p className="text-slate-600 mb-6">Focus on these areas to improve your performance most effectively.</p>
          <div className="space-y-3">
            {getPriorityAreas().map((area, index) => (
              <div key={index} 
                   className="flex items-center justify-between p-4 bg-white rounded-xl border border-teal-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                  <div>
                    <div className="font-medium text-slate-900">{area.skill}</div>
                    <div className="text-sm text-slate-600">{area.section}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-bold ${getScoreColor(area.score)}`}>
                    {area.score}% accuracy
                  </div>
                  <button 
                    className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                    onClick={() => {/* Handle drill start */}}
                  >
                    Drill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const getCombinedSubSkillsRanked = () => {
    const allSkills = [];
    
    // Add diagnostic sub-skills
    Object.entries(diagnosticData.subSkills).forEach(([section, skills]) => {
      Object.entries(skills).forEach(([skill, score]) => {
        allSkills.push({ 
          skill, 
          scores: [score], 
          section,
          sources: ['diagnostic']
        });
      });
    });
    
    // Add practice test sub-skills
    practiceTestData.forEach(test => {
      if (test.subSkills) {
        Object.entries(test.subSkills).forEach(([section, skills]) => {
          Object.entries(skills).forEach(([skill, score]) => {
            const existingSkill = allSkills.find(item => item.skill === skill && item.section === section);
            if (existingSkill) {
              existingSkill.scores.push(score);
              if (!existingSkill.sources.includes('practice')) {
                existingSkill.sources.push('practice');
              }
            } else {
              allSkills.push({ 
                skill, 
                scores: [score], 
                section,
                sources: ['practice']
              });
            }
          });
        });
      }
    });
    
    // Add drill sub-skills
    Object.entries(enhancedDrillData).forEach(([section, skills]) => {
      Object.entries(skills).forEach(([skill, data]) => {
        const existingSkill = allSkills.find(item => item.skill === skill && item.section === section);
        if (existingSkill) {
          existingSkill.scores.push(data.accuracy);
          if (!existingSkill.sources.includes('drill')) {
            existingSkill.sources.push('drill');
          }
        } else {
          allSkills.push({ 
            skill, 
            scores: [data.accuracy], 
            section,
            sources: ['drill']
          });
        }
      });
    });
    
    // Calculate average score for each skill
    const skillsWithAverage = allSkills.map(skill => ({
      ...skill,
      averageScore: Math.round(skill.scores.reduce((sum, score) => sum + score, 0) / skill.scores.length)
    }));
    
    return skillsWithAverage.sort((a, b) => b.averageScore - a.averageScore);
  };

  const getCombinedTopSubSkills = () => {
    return getCombinedSubSkillsRanked().slice(0, 5);
  };

  const getCombinedBottomSubSkills = () => {
    const allSkills = getCombinedSubSkillsRanked();
    return allSkills.slice(-5).reverse();
  };

  const getCombinedFilteredSkills = () => {
    const allSkills = getCombinedSubSkillsRanked();
    
    if (skillFilter === 'all') {
      return allSkills;
    }
    
    return allSkills.filter(item => item.section === skillFilter);
  };

  // Helper functions to get questions completed for each sub-skill
  const getDiagnosticQuestionsCompleted = (skill, section) => {
    // Each diagnostic sub-skill has 5 questions
    return diagnosticData.subSkills[section] && diagnosticData.subSkills[section][skill] ? 5 : 0;
  };

  const getPracticeQuestionsCompleted = (skill, section) => {
    // Count questions from practice tests where this sub-skill appears
    let totalQuestions = 0;
    practiceTestData.forEach(test => {
      if (test.subSkills && test.subSkills[section] && test.subSkills[section][skill]) {
        totalQuestions += 8; // 8 questions per sub-skill per practice test
      }
    });
    return totalQuestions;
  };

  const getDrillQuestionsCompleted = (skill, section) => {
    return enhancedDrillData[section] && enhancedDrillData[section][skill] 
      ? enhancedDrillData[section][skill].completed 
      : 0;
  };

  const getTotalQuestionsCompleted = (skill, section) => {
    return getDiagnosticQuestionsCompleted(skill, section) + 
           getPracticeQuestionsCompleted(skill, section) + 
           getDrillQuestionsCompleted(skill, section);
  };

  // Helper function to format score display - shows dash if no questions completed
  const formatScoreDisplay = (score, skill, section) => {
    const totalQuestions = getTotalQuestionsCompleted(skill, section);
    return totalQuestions === 0 ? '-' : `${score}%`;
  };

  // Helper function to determine if we should show progress bar
  const shouldShowProgressBar = (skill, section) => {
    return getTotalQuestionsCompleted(skill, section) > 0;
  };

  // Helper function to get appropriate score color, using neutral color for no data
  const getScoreColorWithDash = (score, skill, section) => {
    const totalQuestions = getTotalQuestionsCompleted(skill, section);
    if (totalQuestions === 0) return 'text-slate-400';
    return getScoreColor(score);
  };

  // Helper function to get appropriate score color for drills, using neutral color for no data
  const getDrillScoreColorWithDash = (drill) => {
    if (drill.completed === 0) return 'text-slate-400';
    return getScoreColor(drill.accuracy);
  };

  // Helper function to format drill score display - shows dash if no questions completed
  const formatDrillScoreDisplay = (drill) => {
    return drill.completed === 0 ? '-' : `${drill.accuracy}%`;
  };

  // Helper function to determine if we should show progress bar for drills
  const shouldShowDrillProgressBar = (drill) => {
    return drill.completed > 0;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            Performance Insights
          </h1>
          <p className="text-slate-600 text-lg font-medium">VIC Selective Entry (Year 9)</p>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            {[
              { id: 'overview', label: 'Overall', icon: <BarChart3 size={18} /> },
              { id: 'diagnostic', label: 'Diagnostic', icon: <Target size={18} /> },
              { id: 'practice', label: 'Practice Tests', icon: <BookOpen size={18} /> },
              { id: 'drills', label: 'Drills', icon: <Activity size={18} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 ease-out transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content with Loading State */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <span className="text-slate-600 font-medium">Loading...</span>
              </div>
            </div>
          )}
          
          <div className={`transition-all duration-500 ease-out ${isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'diagnostic' && renderDiagnostic()}
            {activeTab === 'practice' && renderPracticeTests()}
            {activeTab === 'drills' && renderDrills()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard; 