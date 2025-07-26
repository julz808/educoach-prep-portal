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
import { getOrCreateSubSkillUUID } from '@/utils/uuidUtils';

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
      console.log('🔧 DRILL: Loading progress for product:', dbProductType);
      
      // Load progress from both drill_sessions (for regular drills) and user_test_sessions (for writing drills)
      console.log('🔧 DRILL-PROGRESS: Loading progress for user:', user.id, 'product:', dbProductType);
      const [drillSessionsResult, userTestSessionsResult] = await Promise.all([
        supabase
          .from('drill_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_type', dbProductType),
        supabase
          .from('user_test_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_type', dbProductType)
          .eq('test_mode', 'drill')
      ]);

      if (drillSessionsResult.error) {
        console.error('Error loading drill_sessions:', drillSessionsResult.error);
      }
      
      if (userTestSessionsResult.error) {
        console.error('Error loading user_test_sessions:', userTestSessionsResult.error);
      }

      const drillSessions = drillSessionsResult.data || [];
      const userTestSessions = userTestSessionsResult.data || [];
      
      console.log('🔧 DRILL: Loaded drill sessions:', drillSessions.length);
      console.log('🔧 DRILL: Loaded writing drill sessions (user_test_sessions):', userTestSessions.length);
      
      // Debug: Show actual writing drill sessions found
      const writingSessions = userTestSessions.filter(session => {
        const sectionName = session.section_name || '';
        return sectionName.toLowerCase().includes('writing') || 
               sectionName.toLowerCase().includes('written') ||
               sectionName.toLowerCase().includes('expression');
      });
      console.log('🔧 DRILL-PROGRESS: Found writing drill sessions:', writingSessions.map(s => ({
        id: s.id,
        section: s.section_name,
        status: s.status,
        currentQuestionIndex: s.current_question_index,
        hasTextAnswers: !!(s.text_answers_data && Object.keys(s.text_answers_data).length > 0)
      })));

      // Organize sessions by sub_skill_id and difficulty
      const progressMap: Record<string, any> = {};
      
      // IMPORTANT: Process writing drill sessions FIRST to ensure they take priority
      // Writing drills in user_test_sessions should always override any drill_sessions entries
      userTestSessions?.forEach(session => {
        console.log(`🔧 WRITING-DRILL: Processing user_test_session: "${session.section_name}", status: ${session.status}`);
        
        const sectionName = session.section_name || '';
        
        // Check if this is a writing drill session
        const isWritingSession = sectionName.toLowerCase().includes('writing') || 
                                sectionName.toLowerCase().includes('written') ||
                                sectionName.toLowerCase().includes('expression');
        
        if (isWritingSession) {
          // Generate the same UUID that would be used in the sub-skill matching
          // This ensures consistency with how drill cards look up progress
          const actualSubSkillId = getOrCreateSubSkillUUID(sectionName);
          console.log(`🔧 WRITING-DRILL: Generated sub_skill_id "${actualSubSkillId}" for section "${sectionName}"`);
          
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
            // For completed sessions, we should get the actual score from writing_assessments
            // For now, use a default high score since the essay was completed and assessed
            completionScore = 85; // Default good score for completed writing assessments
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
          
          console.log(`🔧 WRITING-DRILL: Setting progress for "${actualSubSkillId}": completed=${questionsAnswered}, total=${totalQuestions}, score=${completionScore}%`);
          
          // FIXED: Determine difficulty from session metadata instead of dynamic assignment
          // Try to get difficulty from session metadata first
          let assignedDifficulty: 'easy' | 'medium' | 'hard' = 'medium'; // default fallback
          
          // Check if session has difficulty stored in metadata
          const sessionMetadata = session.test_data || session.session_data || {};
          if (sessionMetadata.difficulty) {
            // Map numeric difficulty back to string
            const difficultyMap = { 1: 'easy', 2: 'medium', 3: 'hard' };
            assignedDifficulty = difficultyMap[sessionMetadata.difficulty] || 'medium';
            console.log(`🔧 WRITING-DRILL: Found difficulty in metadata: ${assignedDifficulty}`);
          } else {
            // Fallback: Use a consistent assignment based on session ID/timestamp
            // This ensures the same session always gets the same difficulty
            const sessionHash = session.id.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            const difficultyIndex = Math.abs(sessionHash) % 3;
            assignedDifficulty = ['easy', 'medium', 'hard'][difficultyIndex] as 'easy' | 'medium' | 'hard';
            console.log(`🔧 WRITING-DRILL: Using hash-based difficulty assignment: ${assignedDifficulty} (hash: ${sessionHash})`);
          }
          
          // Only assign if this difficulty slot is not already taken by another session
          if (progressMap[actualSubSkillId][assignedDifficulty].sessionId && 
              progressMap[actualSubSkillId][assignedDifficulty].sessionId !== session.id) {
            // If this difficulty is already taken by a different session, find the next available
            const availableDifficulties = (['easy', 'medium', 'hard'] as const).filter(diff => 
              !progressMap[actualSubSkillId][diff].sessionId || progressMap[actualSubSkillId][diff].sessionId === session.id
            );
            if (availableDifficulties.length > 0) {
              assignedDifficulty = availableDifficulties[0];
              console.log(`🔧 WRITING-DRILL: Reassigned to available difficulty: ${assignedDifficulty}`);
            }
          }
          
          progressMap[actualSubSkillId][assignedDifficulty] = {
            completed: questionsAnswered,
            total: totalQuestions,
            bestScore: session.status === 'completed' ? completionScore : undefined,
            correctAnswers: questionsAnswered, // For writing, attempted = correct for progress tracking
            sessionId: session.id,
            isCompleted: session.status === 'completed'
          };
          
          console.log(`🔧 WRITING-DRILL: Assigned session ${session.id} to ${assignedDifficulty} difficulty for "${actualSubSkillId}"`);
          console.log(`🔧 WRITING-DRILL: Session details:`, {
            sessionId: session.id,
            status: session.status,
            isCompleted: session.status === 'completed',
            completionScore,
            questionsAnswered,
            totalQuestions
          });
        }
      });
      
      // Process regular drill sessions from drill_sessions table
      // IMPORTANT: Skip any drill_sessions that conflict with writing drill sessions already processed
      drillSessions?.forEach(session => {
        console.log(`🔧 DRILL: Processing drill_session for sub_skill_id: "${session.sub_skill_id}", difficulty: ${session.difficulty}, status: ${session.status}`);
        
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
        
        console.log(`🔧 DRILL: Setting progress for "${session.sub_skill_id}" ${difficultyKey}: completed=${session.questions_answered}, total=${session.questions_total}, totalScore=${totalScore}%`);
        
        progressMap[session.sub_skill_id][difficultyKey] = {
          completed: session.questions_answered || 0,
          total: session.questions_total || 0,
          bestScore: session.status === 'completed' ? totalScore : undefined,
          correctAnswers: session.questions_correct || 0,
          sessionId: session.id, // Store session ID for navigation
          isCompleted: session.status === 'completed' // Track completion status
        };
      });

      console.log('🔧 DRILL: Processed progress map:', progressMap);
      return progressMap;
    } catch (error) {
      console.error('Error loading drill progress:', error);
      return {};
    }
  };

  // Separate function to reload progress data
  const reloadProgressData = async () => {
    try {
      console.log('🔄 DRILL: Reloading progress data...');
      const progressData = await loadDrillProgress();
      setDrillProgress(progressData);
      console.log('🔄 DRILL: Progress data reloaded:', progressData);
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

        console.log('📊 DRILL: Calculated average score from drill sessions:', calculatedAverageScore, '% (', totalCorrect, '/', totalQuestions, 'from', drillSessions.length, 'completed sessions)');
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
        console.log('🔧 DEBUG: Fetching drill modes for product:', selectedProduct);
        
        // Load drill progress from database
        const progressData = await reloadProgressData();

        // Calculate average score from drill sessions
        await calculateAverageScore();
        
        const modes = await fetchDrillModes(selectedProduct);
        console.log('🔧 DEBUG: Received drill modes:', modes);
        console.log('🔧 DEBUG: Number of modes:', modes?.length);
        
        // Detailed logging of the data structure
        if (modes && modes.length > 0) {
          modes.forEach((mode, modeIndex) => {
            console.log(`🔧 DEBUG: Mode ${modeIndex}:`, {
              name: mode.name,
              sections: mode.sections?.length || 0,
              sectionNames: mode.sections?.map(s => s.name) || []
            });
            
            if (mode.sections) {
              mode.sections.forEach((section, sectionIndex) => {
                console.log(`🔧 DEBUG: Mode "${mode.name}" -> Section ${sectionIndex}:`, {
                  name: section.name,
                  questionsCount: section.questions?.length || 0
                });
              });
            }
          });
        }
        
        // Check if we have real data from the database
        if (!modes || modes.length === 0) {
          console.log('🔧 DEBUG: No drill modes found, using fallback message');
          setSkillAreas([]);
          return;
        }
        
        // Transform real Supabase data into hierarchical structure
        const skillAreasMap = new Map<string, SkillArea>();
        
        modes.forEach(mode => {
          console.log('🔧 DEBUG: Processing mode:', mode.name, 'with sections:', mode.sections);
          
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
            
            console.log('🔧 DEBUG: Processing sub-skill:', subSkillName, 'in skill area:', skillAreaName);
            
            // Count actual questions by difficulty level
            const totalQuestions = section.questions.length;
            const easyQuestions = section.questions.filter(q => q.difficulty === 1);
            const mediumQuestions = section.questions.filter(q => q.difficulty === 2);
            const hardQuestions = section.questions.filter(q => q.difficulty === 3);
            
            const easyTotal = easyQuestions.length;
            const mediumTotal = mediumQuestions.length;
            const hardTotal = hardQuestions.length;
            
            console.log(`🔧 DEBUG: Question distribution for ${subSkillName}:`, {
              easy: easyTotal,
              medium: mediumTotal, 
              hard: hardTotal,
              total: totalQuestions
            });
            
            // Get real progress data from database
            // Note: section.id is constructed but we need to match against the actual sub_skill_id from questions
            // Extract the actual sub_skill_id (UUID) from the questions in this section
            const subSkillText = section.questions[0]?.subSkill || section.name;
            const firstQuestionWithUUID = section.questions.find(q => q.subSkillId && q.subSkillId.trim() !== '');
            
            // Use same utility function as TestTaking.tsx to ensure UUID consistency
            const actualSubSkillId = getOrCreateSubSkillUUID(subSkillText, firstQuestionWithUUID?.subSkillId);
            
            console.log(`🔧 DRILL: Looking for progress with actualSubSkillId: "${actualSubSkillId}" (section.id: "${section.id}", section.name: "${section.name}")`);
            console.log(`🔧 DRILL: Available progress keys:`, Object.keys(progressData));
            console.log(`🔧 DRILL: Progress data for this subSkill:`, progressData[actualSubSkillId]);
            
            // Also try alternative keys in case there's still a mismatch
            let realProgress = progressData[actualSubSkillId];
            if (!realProgress) {
              // Try with section.id as fallback
              realProgress = progressData[section.id];
              console.log(`🔧 DRILL: Fallback - trying section.id "${section.id}":`, realProgress);
            }
            if (!realProgress) {
              // Try with section.name as fallback
              realProgress = progressData[section.name];
              console.log(`🔧 DRILL: Fallback - trying section.name "${section.name}":`, realProgress);
            }
            
            // Default if still no match
            if (!realProgress) {
              realProgress = {
                easy: { completed: 0, total: easyTotal, bestScore: undefined, correctAnswers: 0, isCompleted: false },
                medium: { completed: 0, total: mediumTotal, bestScore: undefined, correctAnswers: 0, isCompleted: false },
                hard: { completed: 0, total: hardTotal, bestScore: undefined, correctAnswers: 0, isCompleted: false }
              };
              console.log(`🔧 DRILL: No progress found, using default:`, realProgress);
            } else {
              console.log(`🔧 DRILL: Found existing progress:`, realProgress);
            }
            
            // Update totals to match actual question counts
            realProgress.easy.total = easyTotal;
            realProgress.medium.total = mediumTotal;
            realProgress.hard.total = hardTotal;
            
            console.log(`🔧 DRILL: Progress for ${subSkillName}:`, realProgress);
            
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
            
            console.log('🔧 DEBUG: Added sub-skill:', subSkillName, 'to skill area:', skillAreaName, 'with', totalQuestions, 'questions');
          });
        });
        
        const finalSkillAreas = Array.from(skillAreasMap.values());
        console.log('🔧 DEBUG: Final skill areas:', finalSkillAreas.map(sa => ({
          name: sa.name,
          subSkills: sa.subSkills.length,
          totalQuestions: sa.totalQuestions
        })));
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
        console.log('🔄 DRILL: Page became visible, refreshing progress data...');
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
      console.log('🔄 DRILL: Periodic progress refresh...');
      await reloadProgressData();
    };

    // Refresh on window focus
    const handleFocus = () => refreshProgress();
    window.addEventListener('focus', handleFocus);
    
    // Refresh periodically when window is visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 DRILL: Page became visible, refreshing progress...');
        refreshProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh every 5 seconds in development to catch dev tool changes
    const interval = setInterval(() => {
      if (!document.hidden && import.meta.env.DEV) {
        refreshProgress();
      }
    }, 5000);
    
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
    
    console.log(`🎯 DRILL: Starting ${difficulty} drill (difficulty=${targetDifficulty}):`, availableQuestions.length, 'questions available');
    
    if (availableQuestions.length > 0) {
      try {
        // Check if this is a writing/written expression drill FIRST
        const isWritingDrill = selectedSubSkill.name.toLowerCase().includes('writing') || 
                              selectedSubSkill.name.toLowerCase().includes('written') ||
                              selectedSubSkill.name.toLowerCase().includes('expression');
        
        if (isWritingDrill) {
          // For writing drills, route directly to TestTaking.tsx without session pre-creation
          // TestTaking.tsx will handle session management just like diagnostic/practice tests
          console.log(`🎯 DRILL-WRITING: Writing drill detected - routing to TestTaking.tsx`);
          
          // Check if there's an existing session for this difficulty level
          const difficultyKey = difficulty as 'easy' | 'medium' | 'hard';
          const existingSessionId = selectedSubSkill.progress[difficultyKey]?.sessionId;
          
          console.log(`🎯 DRILL-WRITING: Checking for existing session:`, {
            difficulty: difficultyKey,
            existingSessionId,
            progressData: selectedSubSkill.progress[difficultyKey]
          });
          
          const subjectId = selectedSubSkill.name; // Use full section name as subjectId
          let navigationUrl = `/test/drill/${encodeURIComponent(subjectId)}?sectionName=${encodeURIComponent(selectedSubSkill.name)}&difficulty=${difficulty}`;
          
          // If there's an existing session, include it in the URL to resume instead of creating new
          if (existingSessionId) {
            navigationUrl += `&sessionId=${existingSessionId}`;
            console.log(`🎯 DRILL-WRITING: Including existing sessionId in URL:`, existingSessionId);
          }
          
          console.log(`🎯 DRILL-WRITING: Navigating to: ${navigationUrl}`);
          navigate(navigationUrl);
          return;
        }
        
        // For NON-WRITING drills, continue with existing DrillSessionService logic
        const subSkillText = selectedSubSkill.questions[0]?.subSkill || selectedSubSkill.name;
        const firstQuestionWithUUID = selectedSubSkill.questions.find(q => q.subSkillId && q.subSkillId.trim() !== '');
        
        // Use utility function to get or create a proper UUID
        const actualSubSkillId = getOrCreateSubSkillUUID(subSkillText, firstQuestionWithUUID?.subSkillId);
        console.log('🎯 DRILL: SubSkill UUID for', subSkillText, '→', actualSubSkillId);
        
        const dbProductType = getDbProductType(selectedProduct);
        
        console.log(`🎯 DRILL: Checking for existing session:`, {
          userId: user.id,
          subSkillId: actualSubSkillId,
          difficulty: targetDifficulty,
          productType: dbProductType
        });
        
        // Check for existing active session using DrillSessionService
        const existingSession = await DrillSessionService.getActiveSession(
          user.id,
          actualSubSkillId,
          targetDifficulty,
          dbProductType
        );
        
        // For non-writing drills, keep the current Drill.tsx experience
        console.log(`🎯 DRILL-STANDARD: Using standard drill experience for non-writing section`);
        let navigationUrl = `/test/drill/${selectedSubSkill.id}?skill=${selectedSubSkill.name}&difficulty=${difficulty}&skillArea=${selectedSkillArea.name}`;
        
        if (existingSession) {
          console.log(`🎯 DRILL: Found existing session:`, existingSession);
          
          // Add session ID for resume/review
          navigationUrl += `&sessionId=${existingSession.sessionId}`;
          
          // Add review mode for completed sessions
          if (existingSession.status === 'completed' || 
              (existingSession.questionsAnswered === existingSession.questionsTotal && existingSession.questionsTotal > 0)) {
            navigationUrl += '&review=true';
            console.log(`🎯 DRILL: Session is completed, adding review mode`);
          } else {
            console.log(`🎯 DRILL: Session in progress (${existingSession.questionsAnswered}/${existingSession.questionsTotal}), will resume`);
          }
        } else {
          console.log(`🎯 DRILL: No existing session found, will create new one`);
        }
        
        console.log(`🎯 DRILL: Navigating to: ${navigationUrl}`);
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
                        {data.completed === 0 ? 'Not attempted' : 
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
                              const isWritingSkill = subSkill.name.toLowerCase().includes('writing') || 
                                                   subSkill.name.toLowerCase().includes('written');
                              
                              if (isWritingSkill) {
                                // For writing, show points earned out of max possible points
                                // Calculate actual max points from the questions
                                const totalMaxPoints = subSkill.questions
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
                      {data.completed === 0 ? 'Start Practice' : 
                       data.isCompleted ? 'View Results' : 'Continue Practice'}
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
          console.log('🔄 DRILL: Developer tools data changed, force reloading...');
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
                  "transition-all duration-300 bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 rounded-2xl overflow-hidden",
                  skillArea.totalQuestions > 0 ? "hover:border-orange-300 hover:-translate-y-1" : "opacity-60",
                  getStatusColor(skillArea.completedQuestions, skillArea.totalQuestions)
                )}
              >
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/30 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">{skillArea.name}</CardTitle>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                            <Users size={14} />
                            <span className="font-medium text-xs">{skillArea.subSkills.length} sub-skills</span>
                          </div>
                          <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                            <CheckCircle2 size={14} />
                            <span className="font-medium text-xs">{skillArea.totalQuestions} questions available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {skillArea.completedQuestions === skillArea.totalQuestions && skillArea.totalQuestions > 0 && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 rounded-full">
                          <CheckCircle2 size={12} className="mr-1" />
                          Completed
                        </Badge>
                      )}
                      {skillArea.completedQuestions > 0 && skillArea.completedQuestions < skillArea.totalQuestions && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full">
                          <Timer size={12} className="mr-1" />
                          In Progress
                        </Badge>
                      )}
                      {skillArea.completedQuestions === 0 && (
                        <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 rounded-full">
                          Not Started
                        </Badge>
                      )}
                      {skillArea.totalQuestions > 0 && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSkillArea(skillArea);
                          }}
                        >
                          {skillArea.isExpanded ? 
                            <ChevronUp size={20} className="text-slate-600" /> : 
                            <ChevronDown size={20} className="text-slate-600" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="bg-white">
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
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900">Sub-Skills</h4>
                            <div className="grid gap-4">
                              {skillArea.subSkills.map((subSkill, index) => (
                                <div 
                                  key={subSkill.id}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all duration-200 relative",
                                    subSkill.totalQuestions > 0 ? "hover:shadow-md cursor-pointer" : "opacity-60",
                                    subSkill.isComplete
                                      ? "border-emerald-200 bg-emerald-50/30"
                                      : subSkill.completedQuestions > 0
                                      ? "border-amber-200 bg-amber-50/30"
                                      : "border-slate-200 bg-white"
                                  )}
                                  onClick={() => selectSubSkill(skillArea, subSkill)}
                                >
                                  {subSkill.isRecommended && (
                                    <Badge className="absolute top-2 left-2 bg-rose-100 text-rose-700 border-rose-200 text-xs">
                                      Recommended
                                    </Badge>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className={cn("mb-2", subSkill.isRecommended && "mt-8")}>
                                        <div>
                                          <h5 className="font-semibold text-slate-900">{subSkill.name}</h5>
                                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            <span>{subSkill.completedQuestions} of {subSkill.totalQuestions} questions completed</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="ml-4 flex items-center space-x-3">
                                      {subSkill.isComplete && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                          <CheckCircle2 size={12} className="mr-1" />
                                          Complete
                                        </Badge>
                                      )}
                                      {subSkill.completedQuestions > 0 && !subSkill.isComplete && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                          In Progress
                                        </Badge>
                                      )}
                                      
                                      {subSkill.totalQuestions === 0 ? (
                                        <div className="text-center py-2">
                                          <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                                          <p className="text-xs text-slate-500">Coming soon</p>
                                        </div>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className={cn(
                                            "font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md",
                                            subSkill.completedQuestions === 0 
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
                                          <Play size={14} className="mr-1" />
                                          {subSkill.completedQuestions === 0 ? 'Start Practice' : 
                                           subSkill.isComplete ? 'View Results' : 'Resume Practice'}
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
