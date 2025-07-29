import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { MetricsCards } from '@/components/ui/metrics-cards';
import { 
  BookOpen, Clock, Target, Play, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, ChevronDown, ChevronRight, ChevronUp,
  CheckCircle, CheckCircle2, AlertCircle, Brain, Star, Zap, Flag,
  RotateCcw, ArrowLeft, Award, TrendingUp, Users, Timer,
  Home, MessageSquare, Calculator, PieChart, 
  PenTool, Palette, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { PaywallComponent } from '@/components/PaywallComponent';
import { isPaywallUIEnabled } from '@/config/stripeConfig';
import { 
  fetchDrillModes, 
  type TestMode, 
  type TestSection,
  type OrganizedQuestion
} from '@/services/supabaseQuestionService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DrillSessionService } from '@/services/drillSessionService';
import { DeveloperTools } from '@/components/DeveloperTools';
import { getOrCreateSubSkillUUID, generateDeterministicUUID } from '@/utils/uuidUtils';

// Helper function to generate consistent UUIDs for writing drills
const getWritingDrillUUID = (sectionName: string): string => {
  // For writing drills, always use the section name directly as the key
  // This ensures consistency between progress loading and skill area building
  return getOrCreateSubSkillUUID(sectionName);
};

// Map frontend product IDs to database product_type values
const getDbProductType = (productId: string): string => {
  const productMap: Record<string, string> = {
    'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
    'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
    'acer-year-7': 'ACER Scholarship (Year 7 Entry)'
  };
  console.log('🗺️ DRILL: Mapping productId:', productId, 'to dbProductType:', productMap[productId] || productId);
  return productMap[productId] || productId;
};

interface SubSkillProgress {
  easy: { completed: number; total: number; bestScore?: number; correctAnswers?: number; sessionId?: string; isCompleted?: boolean };
  medium: { completed: number; total: number; bestScore?: number; correctAnswers?: number; sessionId?: string; isCompleted?: boolean };
  hard: { completed: number; total: number; bestScore?: number; correctAnswers?: number; sessionId?: string; isCompleted?: boolean };
}

interface SubSkill {
  id: string;
  name: string;
  description?: string;
  questions: OrganizedQuestion[];
  progress: SubSkillProgress;
  isRecommended?: boolean;
  totalQuestions: number;
  completedQuestions: number;
  isComplete?: boolean; // True when all three difficulties are completed
}

interface SkillArea {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  subSkills: SubSkill[];
  totalQuestions: number;
  completedQuestions: number;
  isExpanded: boolean;
}

const Drill: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'skill-area' | 'sub-skill'>('dashboard');
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([]);
  const [selectedSkillArea, setSelectedSkillArea] = useState<SkillArea | null>(null);
  const [selectedSubSkill, setSelectedSubSkill] = useState<SubSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillProgress, setDrillProgress] = useState<Record<string, any>>({});
  const [averageScore, setAverageScore] = useState<number>(0);
  
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load drill progress from database
  const loadDrillProgress = async () => {
    if (!user) return {};
    
    try {
      const dbProductType = getDbProductType(selectedProduct);
      // Load progress from both drill_sessions (for regular drills) and user_test_sessions (for writing drills)
      // First, let's check if ANY drill sessions exist at all
      const allDrillSessionsResult = await supabase
        .from('drill_sessions')
        .select('*')
        .limit(5);
      const [drillSessionsResult, userTestSessionsResult] = await Promise.all([
        supabase
          .from('drill_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_type', dbProductType),
        supabase
          .from('user_test_sessions')
          .select(`
            *,
            writing_assessments(
              total_score,
              max_possible_score,
              percentage_score
            )
          `)
          .eq('user_id', user.id)
          .eq('product_type', dbProductType)
      ]);
      
      if (drillSessionsResult.error) {
        console.error('Error loading drill_sessions:', drillSessionsResult.error);
      }
      
      if (userTestSessionsResult.error) {
        console.error('Error loading user_test_sessions:', userTestSessionsResult.error);
      }

      const drillSessions = drillSessionsResult.data || [];
      const userTestSessions = userTestSessionsResult.data || [];
      
      // Debug: Show ALL user test sessions to see what's actually in the database
      // Debug: Show actual writing drill sessions found
      const writingSessions = userTestSessions.filter(session => {
        const sectionName = session.section_name || '';
        return sectionName.toLowerCase().includes('writing') || 
               sectionName.toLowerCase().includes('written') ||
               sectionName.toLowerCase().includes('expression');
      });
      // Organize sessions by sub_skill_id and difficulty
      const progressMap: Record<string, any> = {};
      
      // IMPORTANT: Process writing drill sessions FIRST to ensure they take priority
      // Writing drills in user_test_sessions should always override any drill_sessions entries
      userTestSessions?.forEach(session => {
        const sectionName = session.section_name || '';
        
        // Check if this is a writing drill session - look for both test_mode='drill' AND writing-related section names
        const isWritingSession = (session.test_mode === 'drill') && (
          sectionName.toLowerCase().includes('writing') || 
          sectionName.toLowerCase().includes('written') ||
          sectionName.toLowerCase().includes('expression')
        );
        
        if (isWritingSession) {
          // Extract the base section name and difficulty from section_name
          // Format: "Narrative Writing - Essay 1" -> base: "Narrative Writing", difficulty: 1
          let baseSectionName = sectionName;
          let assignedDifficulty: 'easy' | 'medium' | 'hard' = 'medium'; // default
          
          const essayMatch = sectionName.match(/^(.+?)\s*-\s*Essay\s*(\d)$/i);
          if (essayMatch) {
            baseSectionName = essayMatch[1].trim();
            const essayNumber = parseInt(essayMatch[2]);
            assignedDifficulty = essayNumber === 1 ? 'easy' : essayNumber === 2 ? 'medium' : 'hard';
            }
          
          // Use centralized UUID generation for consistency - use base section name
          const actualSubSkillId = getWritingDrillUUID(baseSectionName);
          if (!progressMap[actualSubSkillId]) {
            progressMap[actualSubSkillId] = {
              easy: { completed: 0, total: 0, bestScore: undefined },
              medium: { completed: 0, total: 0, bestScore: undefined },
              hard: { completed: 0, total: 0, bestScore: undefined }
            };
          }
          
          const totalQuestions = session.total_questions || 1;
          
          // For writing drills, calculate progress based on session status
          let questionsAnswered = 0;
          let completionScore = 0;
          
          if (session.status === 'completed') {
            // Completed sessions: user finished the writing drill
            questionsAnswered = Math.max(session.current_question_index + 1, totalQuestions);
            // Get the actual score from writing_assessments for this session
            const writingAssessments = session.writing_assessments;
            if (writingAssessments && writingAssessments.length > 0) {
              // Calculate percentage from total_score and max_possible_score
              const totalScore = writingAssessments[0].total_score || 0;
              const maxScore = writingAssessments[0].max_possible_score || 1;
              completionScore = Math.round((totalScore / maxScore) * 100);
            } else {
              completionScore = 0; // No assessment found, show 0%
            }
          } else if (session.status === 'active') {
            // Active sessions: user started but didn't finish
            // Check if user has written any text responses
            const hasTextResponses = session.text_answers_data && 
              Object.values(session.text_answers_data).some(answer => 
                answer && typeof answer === 'string' && answer.trim().length > 0
              );
            
            if (hasTextResponses || session.current_question_index > 0) {
              // User has made progress - show as in progress
              questionsAnswered = Math.max(session.current_question_index, 1); // At least 1 to show progress
              completionScore = 0; // No score until completed
            } else {
              // Active session but no progress yet
              questionsAnswered = 0;
              completionScore = 0;
            }
          } else {
            // New or paused sessions: not started
            questionsAnswered = 0;
            completionScore = 0;
          }
          
          progressMap[actualSubSkillId][assignedDifficulty] = {
            completed: questionsAnswered,
            total: totalQuestions,
            bestScore: session.status === 'completed' ? completionScore : undefined,
            correctAnswers: questionsAnswered, // For writing, attempted = correct for progress tracking
            sessionId: session.id,
            isCompleted: session.status === 'completed'
          };
          
          }
      });
      
      // Process regular drill sessions from drill_sessions table
      // IMPORTANT: Skip any drill_sessions that conflict with writing drill sessions already processed
      // Debug: Try to reverse-engineer what sub-skill names these UUIDs came from
      const existingProgressKeys = Object.keys(progressMap);
      // Test what deterministic UUIDs would be generated for current sub-skills
      const currentSubSkills = ['Logical Reasoning & Deduction', 'Spatial Reasoning (2D & 3D)', 'Critical Thinking & Problem-Solving', 'Verbal Reasoning & Analogies'];
      drillSessions?.forEach(session => {
        const key = `${session.sub_skill_id}-${session.difficulty}`;
        if (!progressMap[session.sub_skill_id]) {
          progressMap[session.sub_skill_id] = {
            easy: { completed: 0, total: 0, bestScore: undefined },
            medium: { completed: 0, total: 0, bestScore: undefined },
            hard: { completed: 0, total: 0, bestScore: undefined }
          };
        }

        const difficultyKey = session.difficulty === 1 ? 'easy' : session.difficulty === 2 ? 'medium' : 'hard';
        // Calculate score as percentage of total questions, not just attempted ones
        const totalScore = session.questions_total > 0 ? Math.round((session.questions_correct / session.questions_total) * 100) : 0;
        
        progressMap[session.sub_skill_id][difficultyKey] = {
          completed: session.questions_answered || 0,
          total: session.questions_total || 0,
          bestScore: session.status === 'completed' ? totalScore : undefined,
          correctAnswers: session.questions_correct || 0,
          sessionId: session.id, // Store session ID for navigation
          isCompleted: session.status === 'completed' // Track completion status
        };
        
        });

      // Debug: Show final progress for writing skills
      Object.entries(progressMap).forEach(([subSkillId, progress]) => {
        const hasWritingProgress = progress.easy?.sessionId || progress.medium?.sessionId || progress.hard?.sessionId;
        if (hasWritingProgress) {
          }
      });
      
      return progressMap;
    } catch (error) {
      console.error('Error loading drill progress:', error);
      return {};
    }
  };

  // Separate function to reload progress data
  const reloadProgressData = async () => {
    try {
      const progressData = await loadDrillProgress();
      setDrillProgress(progressData);
      return progressData;
    } catch (error) {
      console.error('🔄 DRILL: Error reloading progress:', error);
      return {};
    }
  };

  // Calculate average score from actual drill sessions (same logic as insights)
  const calculateAverageScore = async () => {
    if (!user) {
      setAverageScore(0);
      return;
    }

    try {
      const dbProductType = getDbProductType(selectedProduct);
      
      // Get all completed drill sessions (same query as insights)
      const { data: drillSessions, error: drillError } = await supabase
        .from('drill_sessions')
        .select('questions_correct, questions_total')
        .eq('user_id', user.id)
        .eq('product_type', dbProductType)
        .eq('status', 'completed');

      if (drillError) {
        console.error('❌ Error fetching drill sessions for average score:', drillError);
        setAverageScore(0);
        return;
      }

      // Calculate average score as percentage of correct answers
      if (drillSessions && drillSessions.length > 0) {
        const totalCorrect = drillSessions.reduce((sum, session) => sum + (session.questions_correct || 0), 0);
        const totalQuestions = drillSessions.reduce((sum, session) => sum + (session.questions_total || 0), 0);
        
        const calculatedAverageScore = totalQuestions > 0 
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0;

        setAverageScore(calculatedAverageScore);
      } else {
        setAverageScore(0);
      }
    } catch (error) {
      console.error('Error calculating drill average score:', error);
      setAverageScore(0);
    }
  };

  useEffect(() => {
    const loadDrillData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load drill progress from database
        const progressData = await reloadProgressData();

        // Calculate average score from drill sessions
        await calculateAverageScore();
        
        const modes = await fetchDrillModes(selectedProduct);
        // Detailed logging of the data structure
        if (modes && modes.length > 0) {
          modes.forEach((mode, modeIndex) => {
            if (mode.sections) {
              mode.sections.forEach((section, sectionIndex) => {
                });
            }
          });
        }
        
        // Check if we have real data from the database
        if (!modes || modes.length === 0) {
          setSkillAreas([]);
          return;
        }
        
        // Transform real Supabase data into hierarchical structure
        const skillAreasMap = new Map<string, SkillArea>();
        
        modes.forEach(mode => {
          // Each mode represents a skill area (section_name from database)
          const skillAreaName = mode.name;
          
          if (!skillAreasMap.has(skillAreaName)) {
            skillAreasMap.set(skillAreaName, {
              id: skillAreaName.toLowerCase().replace(/\s+/g, '-'),
              name: skillAreaName,
              description: mode.description || `Practice ${skillAreaName.toLowerCase()} skills`,
              icon: getSkillAreaIcon(skillAreaName),
              color: getSkillAreaColor(skillAreaName),
              subSkills: [],
              totalQuestions: 0,
              completedQuestions: 0,
              isExpanded: false
            });
          }

          const skillArea = skillAreasMap.get(skillAreaName)!;
          
          // Each section within the mode represents a sub-skill
          mode.sections.forEach(section => {
            const subSkillName = section.name;
            
            // Count actual questions by difficulty level
            const totalQuestions = section.questions.length;
            const easyQuestions = section.questions.filter(q => q.difficulty === 1);
            const mediumQuestions = section.questions.filter(q => q.difficulty === 2);
            const hardQuestions = section.questions.filter(q => q.difficulty === 3);
            
            const easyTotal = easyQuestions.length;
            const mediumTotal = mediumQuestions.length;
            const hardTotal = hardQuestions.length;
            
            // Get real progress data from database
            // Check if this is a writing drill to use consistent UUID generation
            const isWritingDrillSection = section.name.toLowerCase().includes('writing') || 
                                        section.name.toLowerCase().includes('written') ||
                                        section.name.toLowerCase().includes('expression');
            
            // Define subSkillText at proper scope for later use
            const subSkillText = section.questions[0]?.subSkill || section.name;
            
            let actualSubSkillId: string;
            if (isWritingDrillSection) {
              // For writing drills, use centralized UUID generation
              actualSubSkillId = getWritingDrillUUID(section.name);
              } else {
              // For regular drills, use the original logic
              const firstQuestionWithUUID = section.questions.find(q => q.subSkillId && q.subSkillId.trim() !== '');
              actualSubSkillId = getOrCreateSubSkillUUID(subSkillText, firstQuestionWithUUID?.subSkillId);
              }
            
            // Also try alternative keys in case there's still a mismatch
            let realProgress = progressData[actualSubSkillId];
            if (!realProgress) {
              // Try with section.id as fallback
              realProgress = progressData[section.id];
              }
            if (!realProgress) {
              // Try with section.name as fallback
              realProgress = progressData[section.name];
              }
            if (!realProgress) {
              // Try generating deterministic UUIDs for different variations of the sub-skill name
              const variations = [
                section.name,
                subSkillText,
                section.questions[0]?.subSkill || '',
                section.name.replace(/[^a-zA-Z0-9]/g, ' ').trim(),
                section.name.toLowerCase(),
              ].filter(Boolean);
              
              for (const variation of variations) {
                const testUUID = generateDeterministicUUID(variation);
                if (progressData[testUUID]) {
                  realProgress = progressData[testUUID];
                  break;
                }
              }
            }
            
            // Default if still no match
            if (!realProgress) {
              realProgress = {
                easy: { completed: 0, total: easyTotal, bestScore: undefined, correctAnswers: 0, isCompleted: false },
                medium: { completed: 0, total: mediumTotal, bestScore: undefined, correctAnswers: 0, isCompleted: false },
                hard: { completed: 0, total: hardTotal, bestScore: undefined, correctAnswers: 0, isCompleted: false }
              };
              } else {
              }
            
            // Update totals to match actual question counts while preserving all other properties
            realProgress.easy = { ...realProgress.easy, total: easyTotal };
            realProgress.medium = { ...realProgress.medium, total: mediumTotal };
            realProgress.hard = { ...realProgress.hard, total: hardTotal };
            
            const subSkill: SubSkill = {
              id: section.id,
              name: subSkillName,
              description: `Master ${subSkillName.toLowerCase()} through targeted practice`,
              questions: section.questions,
              progress: realProgress,
              isRecommended: false, // Could be calculated based on performance
              totalQuestions: totalQuestions,
              completedQuestions: realProgress.easy.completed + realProgress.medium.completed + realProgress.hard.completed,
              isComplete: isSubSkillComplete(realProgress) // New field to track if all difficulties are done
            };

            skillArea.subSkills.push(subSkill);
            skillArea.totalQuestions += totalQuestions;
            skillArea.completedQuestions += subSkill.completedQuestions;
            
            });
        });
        
        const finalSkillAreas = Array.from(skillAreasMap.values());
        setSkillAreas(finalSkillAreas);
      } catch (err) {
        console.error('Error loading drill data:', err);
        setError('Failed to load drill data');
      } finally {
        setLoading(false);
      }
    };

    loadDrillData();
  }, [selectedProduct, user]);
  
  // Refresh progress data when component becomes visible (user returns from drill)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Check if there's a refresh flag from completed writing drill
        const refreshFlag = localStorage.getItem('drill_progress_refresh_needed');
        if (refreshFlag === 'true') {
          localStorage.removeItem('drill_progress_refresh_needed');
        }
        
        reloadProgressData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Add periodic refresh to catch developer tools changes
  useEffect(() => {
    if (!user) return;

    const refreshProgress = async () => {
      await reloadProgressData();
    };

    // Refresh on window focus
    const handleFocus = () => refreshProgress();
    window.addEventListener('focus', handleFocus);
    
    // Refresh periodically when window is visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh every 5 seconds in development to catch dev tool changes
    const interval = setInterval(() => {
      if (!document.hidden && import.meta.env.DEV) {
        refreshProgress();
      }
    }, import.meta.env.DEV ? 5000 : 30000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [user]);

  const getSkillAreaIcon = (skillAreaName: string): React.ReactNode => {
    const name = skillAreaName.toLowerCase();
    if (name.includes('verbal')) return <MessageSquare size={20} className="text-white" />;
    if (name.includes('reading')) return <BookOpen size={20} className="text-white" />;
    if (name.includes('mathematical')) return <Calculator size={20} className="text-white" />;
    if (name.includes('quantitative')) return <PieChart size={20} className="text-white" />;
    if (name.includes('written') || name.includes('expression')) return <PenTool size={20} className="text-white" />;
    if (name.includes('numerical')) return <PieChart size={20} className="text-white" />;
    if (name.includes('abstract')) return <Palette size={20} className="text-white" />;
    return <Brain size={20} className="text-white" />;
  };

  const getSkillAreaColor = (skillAreaName: string): string => {
    const name = skillAreaName.toLowerCase();
    if (name.includes('verbal')) return 'from-blue-500 to-blue-600';
    if (name.includes('reading')) return 'from-green-500 to-green-600';
    if (name.includes('mathematical')) return 'from-purple-500 to-purple-600';
    if (name.includes('quantitative')) return 'from-orange-500 to-orange-600';
    if (name.includes('written') || name.includes('expression')) return 'from-pink-500 to-pink-600';
    if (name.includes('numerical')) return 'from-orange-500 to-orange-600';
    if (name.includes('abstract')) return 'from-pink-500 to-pink-600';
    return 'from-gray-500 to-gray-600';
  };

  const toggleSkillArea = (skillArea: SkillArea) => {
    setSkillAreas(prev => prev.map(sa => 
      sa.id === skillArea.id 
        ? { ...sa, isExpanded: !sa.isExpanded }
        : sa
    ));
  };

  const selectSubSkill = (skillArea: SkillArea, subSkill: SubSkill) => {
    setSelectedSkillArea(skillArea);
    setSelectedSubSkill(subSkill);
    setCurrentView('sub-skill');
  };

  const startDrill = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!selectedSubSkill || !selectedSkillArea || !user) return;
    
    const questions = selectedSubSkill.questions;
    if (questions.length === 0) return;
    
    // Map difficulty names to numeric values
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const targetDifficulty = difficultyMap[difficulty];
    
    // Filter questions by actual difficulty level from database
    const availableQuestions = questions.filter(q => q.difficulty === targetDifficulty);
    
    if (availableQuestions.length > 0) {
      try {
        // Check if this is a writing/written expression drill FIRST
        const isWritingDrill = selectedSubSkill.name.toLowerCase().includes('writing') || 
                              selectedSubSkill.name.toLowerCase().includes('written') ||
                              selectedSubSkill.name.toLowerCase().includes('expression');
        
        if (isWritingDrill) {
          // For writing drills, route directly to TestTaking.tsx without session pre-creation
          // TestTaking.tsx will handle session management just like diagnostic/practice tests
          // Check if there's an existing session for this difficulty level
          const difficultyKey = difficulty as 'easy' | 'medium' | 'hard';
          const existingSessionId = selectedSubSkill.progress[difficultyKey]?.sessionId;
          
          // Use a stable identifier for writing drills - convert to lowercase and replace spaces with hyphens
          const subjectId = selectedSubSkill.name.toLowerCase().replace(/\s+/g, '-');
          let navigationUrl = `/test/drill/${subjectId}?sectionName=${encodeURIComponent(selectedSubSkill.name)}&difficulty=${difficulty}`;
          
          // If there's an existing session, include it in the URL to resume instead of creating new
          if (existingSessionId) {
            navigationUrl += `&sessionId=${existingSessionId}`;
            }
          
          navigate(navigationUrl);
          return;
        }
        
        // For NON-WRITING drills, continue with existing DrillSessionService logic
        const subSkillText = selectedSubSkill.questions[0]?.subSkill || selectedSubSkill.name;
        const firstQuestionWithUUID = selectedSubSkill.questions.find(q => q.subSkillId && q.subSkillId.trim() !== '');
        
        // Use utility function to get or create a proper UUID
        const actualSubSkillId = getOrCreateSubSkillUUID(subSkillText, firstQuestionWithUUID?.subSkillId);
        const dbProductType = getDbProductType(selectedProduct);
        
        // Check for existing active session using DrillSessionService
        const existingSession = await DrillSessionService.getActiveSession(
          user.id,
          actualSubSkillId,
          targetDifficulty,
          dbProductType
        );
        
        // For non-writing drills, keep the current Drill.tsx experience
        let navigationUrl = `/test/drill/${selectedSubSkill.id}?skill=${selectedSubSkill.name}&difficulty=${difficulty}&skillArea=${selectedSkillArea.name}`;
        
        if (existingSession) {
          // Add session ID for resume/review
          navigationUrl += `&sessionId=${existingSession.sessionId}`;
          
          // Add review mode for completed sessions
          if (existingSession.status === 'completed' || 
              (existingSession.questionsAnswered === existingSession.questionsTotal && existingSession.questionsTotal > 0)) {
            navigationUrl += '&review=true';
            } else {
            }
        } else {
          }
        
        navigate(navigationUrl);
      } catch (error) {
        console.error('🎯 DRILL: Error checking/creating drill session:', error);
        // Fallback to navigation method for non-writing drills only
        // (Writing drills already handled above and returned early)
        const navigationUrl = `/test/drill/${selectedSubSkill.id}?skill=${selectedSubSkill.name}&difficulty=${difficulty}&skillArea=${selectedSkillArea.name}`;
        navigate(navigationUrl);
      }
    } else {
      console.warn(`No ${difficulty} questions available for ${selectedSubSkill.name}`);
      // Could show a message to the user here
    }
  };

  const getDifficultyConfig = (difficulty: 'easy' | 'medium' | 'hard') => {
    // All difficulty levels now have the same light grey background with teal theme
    return {
      color: 'edu-teal',
      bgClass: 'bg-slate-50 border-edu-teal border-2 hover:bg-slate-100',
      textClass: 'text-slate-700',
      buttonClass: 'bg-edu-teal hover:bg-edu-teal/90 text-white',
      badgeClass: 'bg-edu-teal/10 text-edu-teal border-edu-teal/20',
      progressColor: 'text-edu-teal'
    };
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Check if a sub-skill is completely finished (all three difficulties completed)
  const isSubSkillComplete = (progress: SubSkillProgress) => {
    return progress.easy.isCompleted && progress.medium.isCompleted && progress.hard.isCompleted;
  };

  // Check if a sub-skill has any progress (has started any difficulty)
  const hasAnyProgress = (progress: SubSkillProgress) => {
    const hasProgress = progress.easy.completed > 0 || progress.medium.completed > 0 || progress.hard.completed > 0 ||
           progress.easy.sessionId || progress.medium.sessionId || progress.hard.sessionId ||
           progress.easy.isCompleted || progress.medium.isCompleted || progress.hard.isCompleted;
    
    // Debug logging for all drills with sessions
    if (progress.easy.sessionId || progress.medium.sessionId || progress.hard.sessionId) {
      }
    
    // Also debug when hasProgress is false but we might expect it to be true
    if (!hasProgress && (progress.easy.total > 0 || progress.medium.total > 0 || progress.hard.total > 0)) {
      }
    
    return hasProgress;
  };

  const getTotalCompleted = () => {
    return skillAreas.reduce((sum, area) => sum + area.completedQuestions, 0);
  };

  const getTotalQuestions = () => {
    return skillAreas.reduce((sum, area) => sum + area.totalQuestions, 0);
  };

  const getRecommendedSubSkills = () => {
    const recommended: { skillArea: SkillArea; subSkill: SubSkill }[] = [];
    skillAreas.forEach(skillArea => {
      skillArea.subSkills.forEach(subSkill => {
        if (subSkill.isRecommended) {
          recommended.push({ skillArea, subSkill });
        }
      });
    });
    return recommended.slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skill drills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Sub-Skill View (Difficulty Selection)
  if (currentView === 'sub-skill' && selectedSubSkill && selectedSkillArea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center"
            >
              <ChevronLeft size={16} className="mr-2" />
              Back to Skills
            </Button>
            <div className="text-sm text-gray-500">
              {selectedSkillArea.name} → {selectedSubSkill.name}
            </div>
          </div>

          {/* Sub-Skill Overview */}
          <div className={cn("bg-gradient-to-r rounded-2xl p-8 text-white mb-8", selectedSkillArea.color)}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl">{selectedSkillArea.icon}</span>
                  <h1 className="text-3xl lg:text-4xl font-bold">
                    {selectedSubSkill.name}
                  </h1>
                </div>
                <p className="text-lg opacity-90 mb-4">
                  {selectedSubSkill.description}
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={16} />
                    <span>{selectedSubSkill.totalQuestions} total questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>{selectedSubSkill.completedQuestions} completed</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {getProgressPercentage(selectedSubSkill.completedQuestions, selectedSubSkill.totalQuestions)}%
                </div>
                <div className="text-sm opacity-80">Complete</div>
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { level: 'easy' as const, data: selectedSubSkill.progress.easy },
              { level: 'medium' as const, data: selectedSubSkill.progress.medium },
              { level: 'hard' as const, data: selectedSubSkill.progress.hard }
            ].map(({ level, data }) => {
              const config = getDifficultyConfig(level);
              
              // Debug: Log what data contains for each difficulty level
              // Check if this is a writing drill to use Essay labels
              const isWritingDrill = selectedSubSkill.name.toLowerCase().includes('writing') || 
                                   selectedSubSkill.name.toLowerCase().includes('written') ||
                                   selectedSubSkill.name.toLowerCase().includes('expression');
              
              // Map difficulty levels to Essay labels for writing drills
              const displayLabel = isWritingDrill ? 
                (level === 'easy' ? 'Essay 1' : level === 'medium' ? 'Essay 2' : 'Essay 3') :
                level;
              
              return (
                <Card key={level} className={cn("transition-all duration-200 hover:shadow-lg cursor-pointer", config.bgClass)}
                      onClick={() => startDrill(level)}>
                  <CardContent className="p-8 text-center h-full flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{displayLabel}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {data.completed === 0 && !data.sessionId && !data.isCompleted ? 'Not attempted' : 
                         data.isCompleted ? `Score: ${data.correctAnswers}/${data.total}` : 
                         `In progress: ${data.completed}/${data.total}`}
                      </p>
                      
                      {/* Progress Circle */}
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="stroke-current text-gray-200"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="stroke-current text-edu-teal"
                            strokeWidth="3"
                            strokeDasharray={`${data.bestScore || 0}, 100`}
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold">
                            {data.bestScore || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Fixed height container for badge to prevent layout shift */}
                      <div className="h-8 flex items-center justify-center mb-4">
                        {data.bestScore && data.completed > 0 && (
                          <Badge variant="outline" className={cn(config.badgeClass)}>
                            {(() => {
                              // Check if this is a writing sub-skill
                              const isWritingSkill = selectedSubSkill.name.toLowerCase().includes('writing') || 
                                                   selectedSubSkill.name.toLowerCase().includes('written');
                              
                              if (isWritingSkill) {
                                // For writing, show points earned out of max possible points
                                // Calculate actual max points from the questions
                                const totalMaxPoints = selectedSubSkill.questions
                                  .filter((_, index) => index < data.total) // Only count the questions that were attempted
                                  .reduce((sum, question) => sum + (question.maxPoints || 30), 0);
                                const earnedPoints = Math.round((data.bestScore / 100) * totalMaxPoints);
                                return `Score: ${earnedPoints}/${totalMaxPoints} (${data.bestScore}%)`;
                              } else {
                                // For non-writing questions, show correct answers out of total questions
                                return `Score: ${data.correctAnswers || 0}/${data.total} (${data.bestScore}%)`;
                              }
                            })()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Button always at bottom */}
                    <Button
                      className={cn("w-full", config.buttonClass)}
                      disabled={data.total === 0}
                    >
                      <Play size={16} className="mr-2" />
                      {data.completed === 0 && !data.sessionId && !data.isCompleted ? 'Start Practice' : 
                       data.isCompleted ? 'Review Response' : 'Continue Practice'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  const recommendedSubSkills = getRecommendedSubSkills();

  // Calculate metrics for hero banner and metrics cards
  const totalSkillAreas = skillAreas.length;
  const totalCompleted = getTotalCompleted();
  const totalQuestions = getTotalQuestions();
  const totalSubSkills = skillAreas.reduce((sum, area) => sum + area.subSkills.length, 0);
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100) || 0;

  const heroBannerProps = {
    title: "Skill Drills",
    subtitle: "Master specific skills through targeted practice",
    metrics: [
      { 
        icon: <Target size={16} />,
        label: "Skill Areas", 
        value: totalSkillAreas.toString() 
      },
      { 
        icon: <CheckCircle size={16} />,
        label: "Questions Completed", 
        value: totalCompleted.toString() 
      },
      { 
        icon: <BarChart3 size={16} />,
        label: "Average Score", 
        value: isNaN(averageScore) ? '0%' : `${Math.round(averageScore)}%`
      }
    ],
    ...(totalQuestions === 0 && {
      warning: {
        icon: <AlertCircle size={16} />,
        message: "No drill questions available for this test type yet."
      }
    }),
    className: "bg-gradient-to-r from-orange-500 to-orange-700"
  };

  const getStatusColor = (completedQuestions: number, totalQuestions: number) => {
    if (completedQuestions === totalQuestions && totalQuestions > 0) {
      return 'border-emerald-200 bg-emerald-50/30';
    } else if (completedQuestions > 0) {
      return 'border-amber-200 bg-amber-50/30';
    }
    return 'border-slate-200 bg-white';
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Development Tools */}
      <DeveloperTools 
        testType="drill" 
        selectedProduct={selectedProduct} 
        onDataChanged={async () => {
          await reloadProgressData();
          await calculateAverageScore();
          // Also reload the drill modes to get fresh data
          window.location.reload();
        }}
      />

      {/* Skill Areas - Single Column */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-900">
          Skill Areas
        </h2>
        
        {skillAreas.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-slate-200">
            <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-700">No Skill Areas Available</h3>
            <p className="text-slate-600">Drill questions for this test type are coming soon.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {skillAreas.map((skillArea) => (
              <Card 
                key={skillArea.id} 
                className={cn(
                  "transition-all duration-300 bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 rounded-xl sm:rounded-2xl overflow-hidden",
                  "mx-2 sm:mx-0",
                  skillArea.totalQuestions > 0 ? "hover:border-orange-300 sm:hover:-translate-y-1" : "opacity-60",
                  getStatusColor(skillArea.completedQuestions, skillArea.totalQuestions)
                )}
              >
                <CardHeader className="p-3 sm:p-4 md:pb-4 bg-gradient-to-r from-slate-50/30 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 truncate">{skillArea.name}</CardTitle>
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-edu-navy bg-edu-teal/10 rounded-full px-2.5 py-1 text-xs">
                          <Users size={12} className="flex-shrink-0" />
                          <span className="font-medium">{skillArea.subSkills.length} sub-skills</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-edu-navy bg-edu-teal/10 rounded-full px-2.5 py-1 text-xs">
                          <CheckCircle2 size={12} className="flex-shrink-0" />
                          <span className="font-medium">{skillArea.totalQuestions} questions</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      {skillArea.completedQuestions === skillArea.totalQuestions && skillArea.totalQuestions > 0 && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 rounded-full text-xs px-2 py-1 flex-shrink-0">
                          <CheckCircle2 size={10} className="mr-1 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">Completed</span>
                          <span className="xs:hidden">✓</span>
                        </Badge>
                      )}
                      {skillArea.completedQuestions > 0 && skillArea.completedQuestions < skillArea.totalQuestions && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full text-xs px-2 py-1 flex-shrink-0">
                          <Timer size={10} className="mr-1 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">In Progress</span>
                          <span className="xs:hidden">⏱</span>
                        </Badge>
                      )}
                      {skillArea.completedQuestions === 0 && !skillArea.subSkills.some(subSkill => hasAnyProgress(subSkill.progress)) && (
                        <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 rounded-full text-xs px-2 py-1 flex-shrink-0">
                          <span className="hidden xs:inline">Not Started</span>
                          <span className="xs:hidden">○</span>
                        </Badge>
                      )}
                      {skillArea.completedQuestions === 0 && skillArea.subSkills.some(subSkill => hasAnyProgress(subSkill.progress)) && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full text-xs px-2 py-1 flex-shrink-0">
                          <Timer size={10} className="mr-1 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">In Progress</span>
                          <span className="xs:hidden">⏱</span>
                        </Badge>
                      )}
                      {skillArea.totalQuestions > 0 && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSkillArea(skillArea);
                          }}
                        >
                          {skillArea.isExpanded ? 
                            <ChevronUp size={16} className="text-slate-600 sm:w-5 sm:h-5" /> : 
                            <ChevronDown size={16} className="text-slate-600 sm:w-5 sm:h-5" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="bg-white p-3 sm:p-6">
                  {skillArea.totalQuestions === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Questions coming soon</p>
                    </div>
                  ) : (
                    <>
                      {/* Collapsed View - Summary */}
                      {!skillArea.isExpanded && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-sm text-slate-600">
                            <span>Progress: {getProgressPercentage(skillArea.completedQuestions, skillArea.totalQuestions)}% complete</span>
                          </div>
                        </div>
                      )}

                      {/* Expanded View - Sub-Skills */}
                      {skillArea.isExpanded && (
                        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-100 px-2 sm:px-0">
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Sub-Skills</h4>
                            <div className="grid gap-3 sm:gap-4">
                              {skillArea.subSkills.map((subSkill, index) => (
                                <div 
                                  key={subSkill.id}
                                  className={cn(
                                    "p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 relative",
                                    "mx-1 sm:mx-0",
                                    subSkill.totalQuestions > 0 ? "sm:hover:shadow-md cursor-pointer" : "opacity-60",
                                    subSkill.isComplete
                                      ? "border-emerald-200 bg-emerald-50/30"
                                      : subSkill.completedQuestions > 0
                                      ? "border-amber-200 bg-amber-50/30"
                                      : "border-slate-200 bg-white"
                                  )}
                                  onClick={() => selectSubSkill(skillArea, subSkill)}
                                >
                                  {subSkill.isRecommended && (
                                    <Badge className="absolute top-2 left-2 bg-rose-100 text-rose-700 border-rose-200 text-xs px-1.5 py-0.5">
                                      <span className="hidden xs:inline">Recommended</span>
                                      <span className="xs:hidden">★</span>
                                    </Badge>
                                  )}
                                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
                                    <div className="flex-1 min-w-0">
                                      <div className={cn("mb-2", subSkill.isRecommended && "mt-6 xs:mt-8")}>
                                        <div>
                                          <h5 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{subSkill.name}</h5>
                                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 mt-1">
                                            <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0 sm:w-3 sm:h-3" />
                                            <span className="truncate">{subSkill.completedQuestions} of {subSkill.totalQuestions} completed</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 xs:gap-3 flex-wrap xs:flex-nowrap justify-end xs:justify-start">
                                      {subSkill.isComplete && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-1 flex-shrink-0">
                                          <CheckCircle2 size={10} className="mr-1 sm:w-3 sm:h-3" />
                                          <span className="hidden xs:inline">Complete</span>
                                          <span className="xs:hidden">✓</span>
                                        </Badge>
                                      )}
                                      {!subSkill.isComplete && hasAnyProgress(subSkill.progress) && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-2 py-1 flex-shrink-0">
                                          <span className="hidden xs:inline">In Progress</span>
                                          <span className="xs:hidden">⏱</span>
                                        </Badge>
                                      )}
                                      
                                      {subSkill.totalQuestions === 0 ? (
                                        <div className="text-center py-1 flex-shrink-0">
                                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mx-auto mb-1" />
                                          <p className="text-xs text-slate-500">Soon</p>
                                        </div>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className={cn(
                                            "font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0",
                                            "px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-xs xs:text-sm min-w-0",
                                            !hasAnyProgress(subSkill.progress) && !subSkill.isComplete
                                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                                              : subSkill.isComplete
                                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                                          )}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectSubSkill(skillArea, subSkill);
                                          }}
                                        >
                                          <div className="flex items-center min-w-0">
                                            <Play size={10} className="mr-1 xs:mr-1.5 flex-shrink-0 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
                                            <span className="truncate text-xs xs:text-sm">
                                              {!hasAnyProgress(subSkill.progress) && !subSkill.isComplete ? 
                                                (<><span className="hidden xs:inline">Start Practice</span><span className="xs:hidden">Start</span></>) : 
                                               subSkill.isComplete ? 
                                                (<><span className="hidden xs:inline">View Results</span><span className="xs:hidden">View</span></>) : 
                                                (<><span className="hidden xs:inline">Continue Practice</span><span className="xs:hidden">Continue</span></>)}
                                            </span>
                                          </div>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drill;
