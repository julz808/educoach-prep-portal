import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Sparkles, Target, Trophy } from 'lucide-react';

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
        'Implicit meaning understanding': 82,
        'Deductive reasoning from text': 81,
        'Academic knowledge application': 83
      },
      'Mathematical Reasoning': {
        'Mathematical problem solving': 70,
        'Multi-step reasoning': 65,
        'Complex mathematical concepts': 60,
        'Mathematical modeling': 72,
        'Advanced numerical reasoning': 68,
        'Spatial problem solving': 55,
        'Mathematical application': 75
      },
      'Verbal Reasoning': {
        'Pattern detection with words': 78,
        'Vocabulary reasoning': 80,
        'Word relationships': 75,
        'Odd word identification': 72,
        'Word meaning analysis': 78,
        'Letter manipulation': 70,
        'Logical word consequences': 74
      },
      'Quantitative Reasoning': {
        'Number pattern recognition': 68,
        'Quantitative problem solving': 62,
        'Mathematical sequence analysis': 58,
        'Numerical relationships': 70,
        'Word problem solving': 60,
        'Mathematical reasoning': 65,
        'Quantitative analysis': 67
      },
      'Written Expression': {
        'Creative writing': 80,
        'Analytical writing': 76
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
          'Critical interpretation': 76,
          'Implicit meaning understanding': 75,
          'Deductive reasoning from text': 73,
          'Academic knowledge application': 77
        },
        'Mathematical Reasoning': {
          'Mathematical problem solving': 65,
          'Multi-step reasoning': 58,
          'Complex mathematical concepts': 55,
          'Mathematical modeling': 68,
          'Advanced numerical reasoning': 62,
          'Spatial problem solving': 50,
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
          'Inferential reasoning': 76,
          'Text analysis': 78,
          'Critical interpretation': 80,
          'Implicit meaning understanding': 79,
          'Deductive reasoning from text': 77,
          'Academic knowledge application': 81
        },
        'Mathematical Reasoning': {
          'Mathematical problem solving': 68,
          'Multi-step reasoning': 62,
          'Complex mathematical concepts': 58,
          'Mathematical modeling': 70,
          'Advanced numerical reasoning': 65,
          'Spatial problem solving': 53,
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
          'Inferential reasoning': 79,
          'Text analysis': 80,
          'Critical interpretation': 82,
          'Implicit meaning understanding': 81,
          'Deductive reasoning from text': 80,
          'Academic knowledge application': 83
        }
      }
    }
  ];

  // Enhanced drill data
  const enhancedDrillData = {
    'Reading Reasoning': {
      'Reading comprehension': { completed: 15, accuracy: 82 },
      'Inferential reasoning': { completed: 8, accuracy: 75 },
      'Text analysis': { completed: 12, accuracy: 78 },
      'Critical interpretation': { completed: 6, accuracy: 80 },
      'Academic knowledge application': { completed: 4, accuracy: 85 }
    },
    'Mathematical Reasoning': {
      'Spatial problem solving': { completed: 24, accuracy: 58 },
      'Multi-step reasoning': { completed: 12, accuracy: 68 },
      'Complex mathematical concepts': { completed: 18, accuracy: 62 },
      'Mathematical modeling': { completed: 9, accuracy: 71 },
      'Advanced numerical reasoning': { completed: 15, accuracy: 65 }
    },
    'Verbal Reasoning': {
      'Pattern detection with words': { completed: 10, accuracy: 76 },
      'Word relationships': { completed: 8, accuracy: 73 },
      'Vocabulary reasoning': { completed: 6, accuracy: 82 }
    },
    'Quantitative Reasoning': {
      'Mathematical sequence analysis': { completed: 18, accuracy: 62 },
      'Word problem solving': { completed: 15, accuracy: 65 },
      'Number pattern recognition': { completed: 12, accuracy: 70 },
      'Quantitative analysis': { completed: 8, accuracy: 63 }
    },
    'Written Expression': {
      'Creative writing': { completed: 3, accuracy: 78 },
      'Analytical writing': { completed: 2, accuracy: 74 }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 65) return 'text-slate-600';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 75) return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100';
    if (score >= 65) return 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 shadow-slate-100';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-red-100';
  };

  const getBarColor = (score) => {
    if (score >= 75) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (score >= 65) return 'bg-gradient-to-r from-slate-400 to-gray-400';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  const getBadgeStyle = (score) => {
    if (score >= 75) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 65) return 'bg-slate-100 text-slate-700 border-slate-200';
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
          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-200'
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
    return getAllSubSkillsRanked().filter(item => item.score < 70).slice(0, 3);
  };

  const getStrengths = () => {
    return getAllSubSkillsRanked().filter(item => item.score >= 80).slice(0, 3);
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
    const combinedPerformance = {};
    
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
        const drillScores = Object.values(enhancedDrillData[section]).map(skill => skill.accuracy);
        const drillQuestions = Object.values(enhancedDrillData[section]).reduce((sum, skill) => sum + skill.completed, 0);
        
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
      .filter(([_, data]) => data.averageScore >= 75)
      .sort((a, b) => b[1].averageScore - a[1].averageScore)
      .slice(0, 3);
  };

  const getOverviewWeaknesses = () => {
    const combinedPerformance = getCombinedSectionPerformance();
    return Object.entries(combinedPerformance)
      .filter(([_, data]) => data.averageScore < 70)
      .sort((a, b) => a[1].averageScore - b[1].averageScore)
      .slice(0, 3);
  };

  const renderOverview = () => {
    const metrics = getOverviewMetrics();
    const sectionPerformance = getCombinedSectionPerformance();
    const strengths = getOverviewStrengths();
    const weaknesses = getOverviewWeaknesses();
    
    return (
      <div className="space-y-8" key={`overview-${animationKey}`}>
        {/* Hero Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 border-teal-200" glow>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-teal-900">Total Questions Completed</h3>
                </div>
                <p className="text-sm text-teal-700 opacity-80">Across all activities</p>
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
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-bold text-slate-900">Average Performance</h3>
                </div>
                <p className="text-sm text-slate-600 opacity-80">All sections combined</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${getScoreColor(metrics.averagePerformance)} mb-1`}>
                  {metrics.averagePerformance}%
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-full ${getBadgeStyle(metrics.averagePerformance)}`}>
                  {metrics.averagePerformance >= 75 ? 'Excellent' : metrics.averagePerformance >= 65 ? 'Good' : 'Needs Work'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Section Performance Summary */}
        <Card className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-6 h-6 text-teal-500" />
            <h3 className="text-xl font-bold text-slate-900">Section Performance Summary</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(sectionPerformance).map(([section, data], index) => (
              <div key={section} 
                   className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 transform hover:scale-[1.02]"
                   style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getBarColor(data.averageScore)}`}></div>
                  <div>
                    <h4 className="font-bold text-slate-900">{section}</h4>
                    <p className="text-sm text-slate-600">{data.totalQuestions} questions practiced</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="w-40">
                    <AnimatedProgressBar value={data.averageScore} delay={index * 200} />
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(data.averageScore)} w-16 text-right`}>
                    {data.averageScore}%
                  </div>
                  <div className="w-6 h-6 flex justify-center">
                    {getTrendIcon(data.trend)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200" hover={false}>
            <div className="flex items-center space-x-3 mb-6">
              <Trophy className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-emerald-900">Top Strengths</h3>
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-4">
                {strengths.map(([section, data], index) => (
                  <div key={index} 
                       className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-emerald-200/50"
                       style={{ animationDelay: `${index * 150}ms` }}>
                    <div>
                      <div className="font-bold text-emerald-800">{section}</div>
                      <div className="text-sm text-emerald-600">{data.totalQuestions} questions practiced</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-black text-emerald-900 text-lg">{data.averageScore}%</div>
                        {getTrendIcon(data.trend)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-emerald-700 text-sm">Complete more practice to identify strengths</p>
              </div>
            )}
          </Card>

          <Card className="p-8 bg-gradient-to-br from-red-50 to-rose-50 border-red-200" hover={false}>
            <div className="flex items-center space-x-3 mb-6">
              <Target className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold text-red-900">Priority Focus Areas</h3>
            </div>
            {weaknesses.length > 0 ? (
              <div className="space-y-4">
                {weaknesses.map(([section, data], index) => (
                  <div key={index} 
                       className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-red-200/50"
                       style={{ animationDelay: `${index * 150}ms` }}>
                    <div>
                      <div className="font-bold text-red-800">{section}</div>
                      <div className="text-sm text-red-600">{data.totalQuestions} questions practiced</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-black text-red-900 text-lg">{data.averageScore}%</div>
                        {getTrendIcon(data.trend)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-3">🎉</div>
                <p className="text-red-700 text-sm font-medium">Great job! No major weak areas identified</p>
              </div>
            )}
          </Card>
        </div>

        {/* Activity Summary */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Activity Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Diagnostic Summary */}
            <div className="p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-slate-900 mb-4">Diagnostic Test</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Overall Score</span>
                  <span className={`font-bold ${getScoreColor(diagnosticData.overall)}`}>
                    {diagnosticData.overall}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Completed</span>
                  <span className="text-emerald-600 font-medium">✓ Yes</span>
                </div>
              </div>
            </div>

            {/* Practice Tests Summary */}
            <div className="p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-slate-900 mb-4">Practice Tests</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Completed</span>
                  <span className="text-slate-900 font-medium">{practiceTestData.length}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Latest Score</span>
                  <span className={`font-bold ${getScoreColor(practiceTestData[practiceTestData.length - 1]?.overall || 0)}`}>
                    {practiceTestData[practiceTestData.length - 1]?.overall || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Improvement</span>
                  <span className={`font-bold ${
                    practiceTestData.length > 1 && 
                    practiceTestData[practiceTestData.length - 1].overall > practiceTestData[0].overall
                      ? 'text-emerald-600' 
                      : 'text-slate-600'
                  }`}>
                    {practiceTestData.length > 1 
                      ? `+${practiceTestData[practiceTestData.length - 1].overall - practiceTestData[0].overall}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Drills Summary */}
            <div className="p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 hover:shadow-lg transition-all duration-300">
              <h4 className="font-bold text-slate-900 mb-4">Skill Drills</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Questions</span>
                  <span className="text-slate-900 font-medium">{getTotalDrillsCompleted()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Most Practiced</span>
                  <span className="text-slate-900 font-medium">
                    {getFilteredDrills()[0]?.skill?.split(' ').slice(0, 2).join(' ') || 'None'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Skills Drilled</span>
                  <span className="text-slate-900 font-medium">
                    {Object.values(enhancedDrillData).reduce((total, section) => 
                      total + Object.keys(section).length, 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Enhanced Spider Chart Component with animations
  const SpiderChart = ({ data, size = 300 }) => {
    const [animationProgress, setAnimationProgress] = useState(0);
    const sections = Object.keys(data);
    const scores = Object.values(data);
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
            const labelRadius = radius + 30;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);
            
            return (
              <g key={index} className="transition-all duration-300 ease-out">
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold fill-slate-700"
                  style={{
                    transform: `translate(${x < center ? '-25px' : x > center ? '25px' : '0'}, 0)`
                  }}
                >
                  {section.split(' ')[0]}
                </text>
                <text
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-slate-600"
                  style={{
                    transform: `translate(${x < center ? '-25px' : x > center ? '25px' : '0'}, 0)`
                  }}
                >
                  {section.split(' ').slice(1).join(' ')}
                </text>
                <text
                  x={x}
                  y={y + 28}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-sm font-black ${getScoreColor(scores[index])}`}
                  style={{
                    transform: `translate(${x < center ? '-25px' : x > center ? '25px' : '0'}, 0)`
                  }}
                >
                  {scores[index]}%
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
            <h3 className="text-xl font-bold text-slate-900">Overall Performance</h3>
            <p className="text-sm text-slate-600 opacity-80">VIC Selective Entry Diagnostic</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${getScoreColor(diagnosticData.overall)} mb-2`}>
              {diagnosticData.overall}%
            </div>
            <div className={`text-sm font-medium px-4 py-2 rounded-full ${getBadgeStyle(diagnosticData.overall)}`}>
              {diagnosticData.overall >= 75 ? 'Excellent' : diagnosticData.overall >= 65 ? 'Good' : 'Needs Work'}
            </div>
          </div>
        </div>
      </Card>

      {/* Spider Chart */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-teal-500" />
          <h3 className="text-xl font-bold text-slate-900">Section Performance Overview</h3>
        </div>
        <SpiderChart data={diagnosticData.sections} size={400} />
      </Card>

      {/* Skills Performance with Enhanced Filters */}
      <Card className="p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h3 className="text-xl font-bold text-slate-900">Skills Performance</h3>
          <div className="flex flex-wrap gap-2">
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
              <div className="flex-1">
                <AnimatedProgressBar value={item.score} delay={index * 100} />
              </div>
              <div className={`w-16 text-sm font-bold text-right ${getScoreColor(item.score)}`}>
                {item.score}%
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

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200" hover={false}>
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-bold text-emerald-900">Top Strengths</h3>
          </div>
          <div className="space-y-3">
            {getStrengths().map((item, index) => (
              <div key={index} 
                   className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all duration-300"
                   style={{ animationDelay: `${index * 150}ms` }}>
                <span className="text-sm font-bold text-emerald-800">{item.skill}</span>
                <span className="font-black text-emerald-900 text-lg">{item.score}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-red-50 to-rose-50 border-red-200" hover={false}>
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold text-red-900">Priority Areas</h3>
          </div>
          <div className="space-y-4">
            {getPriorityAreas().map((item, index) => (
              <div key={index} 
                   className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-red-200/50 hover:bg-white/80 transition-all duration-300"
                   style={{ animationDelay: `${index * 150}ms` }}>
                <div>
                  <div className="text-sm font-bold text-red-800">{item.skill}</div>
                  <div className="text-xs text-red-600">{item.section}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-red-900 text-lg">{item.score}%</div>
                  <button className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-1 text-xs rounded-lg mt-1 hover:from-red-700 hover:to-rose-700 transition-all duration-200 transform hover:scale-105">
                    Start Drill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
                        ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-lg shadow-teal-200'
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

        {/* Progress Trend Chart */}
        <Card className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-teal-500" />
            <h3 className="text-xl font-bold text-slate-900">Overall Progress Trend</h3>
          </div>
          <div className="h-80 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 relative border border-slate-200">
            <div className="flex items-end justify-between h-full">
              {practiceTestData.map((test, index) => (
                <div key={test.id} 
                     className="flex flex-col items-center space-y-3 transition-all duration-300 hover:scale-110"
                     style={{ animationDelay: `${index * 200}ms` }}>
                  <div 
                    className={`w-20 rounded-t-xl flex items-end justify-center pb-3 transition-all duration-1000 ease-out shadow-lg ${
                      selectedTest === test.id 
                        ? 'bg-gradient-to-t from-teal-600 to-emerald-500 shadow-teal-300' 
                        : 'bg-gradient-to-t from-teal-500 to-emerald-400 shadow-teal-200'
                    }`}
                    style={{ 
                      height: `${Math.max((test.overall / 100) * 240, 60)}px`,
                      animationDelay: `${index * 300}ms`
                    }}
                  >
                    <span className="text-white text-sm font-black">{test.overall}%</span>
                  </div>
                  <div className={`text-sm font-bold transition-colors duration-200 ${
                    selectedTest === test.id ? 'text-teal-600' : 'text-slate-600'
                  }`}>
                    Test {test.id}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{test.date}</div>
                </div>
              ))}
            </div>
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
                  <div className={`text-5xl font-black ${getScoreColor(selectedTestData.overall)} mb-2`}>
                    {selectedTestData.overall}%
                  </div>
                  <div className={`text-sm font-medium px-4 py-2 rounded-full ${getBadgeStyle(selectedTestData.overall)}`}>
                    {selectedTestData.overall >= 75 ? 'Excellent' : selectedTestData.overall >= 65 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Section Spider Chart */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Section Performance</h3>
              <SpiderChart data={selectedTestData.sections} size={400} />
            </Card>

            {/* Skills Performance with Filters */}
            {selectedTestData.subSkills && Object.keys(selectedTestData.subSkills).length > 0 && (
              <Card className="p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h3 className="text-xl font-bold text-slate-900">Skills Performance</h3>
                  <div className="flex flex-wrap gap-2">
                    <FilterButton
                      active={practiceSkillFilter === 'all'}
                      onClick={() => setPracticeSkillFilter('all')}
                    >
                      All Skills
                    </FilterButton>
                    {Object.keys(selectedTestData.subSkills).map((section) => (
                      <FilterButton
                        key={section}
                        active={practiceSkillFilter === section}
                        onClick={() => setPracticeSkillFilter(section)}
                      >
                        {section.split(' ')[0]}
                      </FilterButton>
                    ))}
                  </div>
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
                      <div className="flex-1">
                        <AnimatedProgressBar value={item.score} delay={index * 100} />
                      </div>
                      <div className={`w-16 text-sm font-bold text-right ${getScoreColor(item.score)}`}>
                        {item.score}%
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

            {/* Combined Section Progress & Trends */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Section Performance Over Time</h3>
              <div className="space-y-8">
                {/* Overall Progress Chart */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-4">Overall Test Scores</h4>
                  <div className="h-40 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-end justify-between h-full">
                      {practiceTestData.map((test, index) => (
                        <div key={test.id} 
                             className="flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-110"
                             style={{ animationDelay: `${index * 150}ms` }}>
                          <div 
                            className={`w-16 rounded-t-lg flex items-end justify-center pb-2 transition-all duration-1000 ease-out ${
                              selectedTest === test.id 
                                ? 'bg-gradient-to-t from-teal-600 to-emerald-500' 
                                : 'bg-gradient-to-t from-teal-400 to-emerald-300'
                            }`}
                            style={{ height: `${Math.max((test.overall / 100) * 100, 20)}px` }}
                          >
                            <span className="text-white text-xs font-bold">{test.overall}%</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">T{test.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section Trends */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-4">By Section</h4>
                  <div className="space-y-6">
                    {Object.entries(trendData).map(([sectionName, sectionTrend], sectionIndex) => (
                      <div key={sectionName} 
                           className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300"
                           style={{ animationDelay: `${sectionIndex * 100}ms` }}>
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-bold text-slate-900">{sectionName}</h5>
                          <div className="flex items-center space-x-3">
                            {sectionTrend.length > 1 && (
                              <span className={`text-sm font-bold flex items-center space-x-1 ${
                                sectionTrend[sectionTrend.length - 1].score > sectionTrend[0].score 
                                  ? 'text-emerald-600' 
                                  : sectionTrend[sectionTrend.length - 1].score < sectionTrend[0].score
                                    ? 'text-red-500'
                                    : 'text-slate-600'
                              }`}>
                                <span>
                                  {sectionTrend[sectionTrend.length - 1].score > sectionTrend[0].score ? '↗' : 
                                   sectionTrend[sectionTrend.length - 1].score < sectionTrend[0].score ? '↘' : '→'}
                                </span>
                                <span>{Math.abs(sectionTrend[sectionTrend.length - 1].score - sectionTrend[0].score)}%</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-end space-x-4 h-20">
                          {sectionTrend.map((point, pointIndex) => (
                            <div key={point.testId} 
                                 className="flex flex-col items-center space-y-2 transition-all duration-300 hover:scale-110"
                                 style={{ animationDelay: `${pointIndex * 100}ms` }}>
                              <div 
                                className={`w-12 rounded-t-lg transition-all duration-1000 ease-out ${
                                  selectedTest === point.testId 
                                    ? 'bg-gradient-to-t from-teal-600 to-emerald-500' 
                                    : 'bg-gradient-to-t from-teal-400 to-emerald-300'
                                }`}
                                style={{ height: `${Math.max((point.score / 100) * 60, 12)}px` }}
                              ></div>
                              <span className="text-xs text-slate-500 font-medium">T{point.testId}</span>
                              <span className={`text-xs font-bold ${getScoreColor(point.score)}`}>
                                {point.score}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Placeholder when no test selected */}
        {!selectedTestData && (
          <Card className="p-16 text-center border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50">
            <div className="text-slate-500">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-bold mb-2">Select a Practice Test</h3>
              <p className="text-sm">Choose a completed practice test above to view detailed performance analysis</p>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderDrills = () => {
    const totalDrills = getTotalDrillsCompleted();
    const sectionTotals = getSectionDrillTotals();
    
    return (
      <div className="space-y-8" key={`drills-${animationKey}`}>
        {/* Total Drills Banner */}
        <Card className="p-8 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 border-teal-200 shadow-xl shadow-teal-100">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-bold text-teal-900">Total Practice Completed</h3>
              </div>
              <p className="text-sm text-teal-700 opacity-80">Questions drilled across all skills</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-teal-600 mb-1">{totalDrills}</div>
              <div className="text-sm text-teal-600 font-medium">questions</div>
            </div>
          </div>
        </Card>

        {/* Drill Performance with Enhanced Filters */}
        <Card className="p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h3 className="text-xl font-bold text-slate-900">Drill Performance</h3>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={drillFilter === 'all'}
                onClick={() => setDrillFilter('all')}
                count={getFilteredDrills().length}
              >
                All Skills
              </FilterButton>
              {Object.keys(enhancedDrillData).map((section) => (
                <FilterButton
                  key={section}
                  active={drillFilter === section}
                  onClick={() => setDrillFilter(section)}
                  count={Object.keys(enhancedDrillData[section]).length}
                >
                  {section.split(' ')[0]}
                </FilterButton>
              ))}
            </div>
          </div>
          
          {/* Show section totals if filtered */}
          {drillFilter !== 'all' && sectionTotals[drillFilter] && (
            <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-lg">{drillFilter}</span>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">
                      {sectionTotals[drillFilter].completed}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">questions</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${getScoreColor(sectionTotals[drillFilter].averageAccuracy)}`}>
                      {sectionTotals[drillFilter].averageAccuracy}%
                    </div>
                    <div className="text-xs text-slate-500 font-medium">avg accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {getFilteredDrills().map((item, index) => (
              <div key={index} 
                   className="flex items-center space-x-4 p-5 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                   style={{ animationDelay: `${index * 50}ms` }}>
                <div className="w-64 text-sm text-slate-700 font-medium truncate" title={item.skill}>
                  {item.skill}
                </div>
                {drillFilter === 'all' && (
                  <div className="w-36 text-xs text-slate-500 truncate font-medium">
                    {item.section}
                  </div>
                )}
                <div className="w-24 text-center">
                  <div className="text-lg font-black text-slate-900">{item.completed}</div>
                  <div className="text-xs text-slate-500 font-medium">questions</div>
                </div>
                <div className="flex-1">
                  <AnimatedProgressBar value={item.accuracy} delay={index * 100} />
                </div>
                <div className={`w-20 text-sm font-bold text-right ${getScoreColor(item.accuracy)}`}>
                  {item.accuracy}%
                </div>
                <button 
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 text-sm font-medium rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  onClick={() => {/* Handle continue drilling */}}
                >
                  Continue
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Priority Recommendations */}
        <Card className="p-8 bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-xl shadow-red-100">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold text-red-900">Recommended Focus Areas</h3>
          </div>
          <div className="space-y-4">
            {getPriorityAreas().slice(0, 3).map((item, index) => {
              const drillData = getFilteredDrills().find(drill => drill.skill === item.skill);
              return (
                <div key={index} 
                     className="flex justify-between items-center p-6 bg-white/60 rounded-xl border border-red-200/50 hover:bg-white/80 transition-all duration-300"
                     style={{ animationDelay: `${index * 150}ms` }}>
                  <div>
                    <div className="font-bold text-red-800 text-lg">{item.skill}</div>
                    <div className="text-sm text-red-600 mt-1">
                      <span className="font-medium">Diagnostic:</span> {item.score}% • 
                      {drillData 
                        ? ` Drilled: ${drillData.completed} questions (${drillData.accuracy}% accuracy)`
                        : ' Not drilled yet'
                      }
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 font-medium rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                    {drillData ? 'Continue' : 'Start'} Drilling
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Performance Insights
          </h1>
          <p className="text-slate-600 text-lg font-medium">VIC Selective Entry (Year 9)</p>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'diagnostic', label: 'Diagnostic', icon: '🎯' },
              { id: 'practice', label: 'Practice Tests', icon: '📝' },
              { id: 'drills', label: 'Drills', icon: '💪' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 ease-out transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
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