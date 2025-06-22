import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { TestInstructions } from '@/components/TestInstructions';
import { useProduct } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { TEST_STRUCTURES } from '@/data/curriculumData';
import { SessionService } from '@/services/sessionService';
import { 
  fetchDiagnosticModes,
  fetchQuestionsFromSupabase
} from '@/services/supabaseQuestionService';

// Map frontend course IDs back to proper display names (same as in TestTaking.tsx)
const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship (Year 7 Entry)',
  'acer-year-7': 'ACER Scholarship (Year 7 Entry)',
  'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
  'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
  'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
  'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
};

const TestInstructionsPage: React.FC = () => {
  const { testType, subjectId, sessionId } = useParams<{ 
    testType: string; 
    subjectId: string; 
    sessionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedProduct } = useProduct();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sectionInfo, setSectionInfo] = useState<{
    name: string;
    questionCount: number;
    timeLimit: number;
    format: 'Multiple Choice' | 'Written Response';
    isResume: boolean;
  } | null>(null);

  const sectionName = searchParams.get('sectionName') || '';

  useEffect(() => {
    const loadSectionInfo = async () => {
      if (!user || !testType || !subjectId || !selectedProduct) return;

      try {
        setLoading(true);
        
        // Get proper display name
        const properDisplayName = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;
        console.log('🔍 TestInstructions DEBUG:');
        console.log('selectedProduct:', selectedProduct);
        console.log('properDisplayName:', properDisplayName);
        console.log('sectionName:', sectionName);

        // Get section details from CurriculumData.ts using proper display name
        const testStructure = TEST_STRUCTURES[properDisplayName as keyof typeof TEST_STRUCTURES];
        let timeLimit = 30; // Default
        let format: 'Multiple Choice' | 'Written Response' = 'Multiple Choice';
        let questionCount = 0;

        if (testStructure) {
          // Try to find section in curriculum data
          const sectionData = Object.entries(testStructure).find(([key]) => {
            const keyLower = key.toLowerCase();
            const sectionLower = sectionName.toLowerCase();
            return keyLower === sectionLower || 
                   keyLower.includes(sectionLower) || 
                   sectionLower.includes(keyLower);
          });

          if (sectionData) {
            const [, data] = sectionData as [string, any];
            timeLimit = data.time || 30;
            format = data.format || 'Multiple Choice';
            questionCount = data.questions || 0;
          }
        }

        // Get actual question count from database
        if (testType === 'diagnostic') {
          const diagnosticModes = await fetchDiagnosticModes(selectedProduct);
          let foundSection = null;
          for (const mode of diagnosticModes) {
            foundSection = mode.sections.find(section => 
              section.id === subjectId || 
              section.name.toLowerCase().includes(subjectId.toLowerCase())
            );
            if (foundSection) break;
          }
          if (foundSection) {
            questionCount = foundSection.questions.length;
          }
        } else if (testType === 'practice') {
          const organizedData = await fetchQuestionsFromSupabase();
          const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
          if (currentTestType) {
            let foundSection = null;
            for (const testMode of currentTestType.testModes) {
              if (testMode.id && (testMode.id.startsWith('practice_') || testMode.name.toLowerCase().includes('practice'))) {
                foundSection = testMode.sections.find(section => 
                  section.id === subjectId || 
                  section.name.toLowerCase().includes(subjectId.toLowerCase()) ||
                  subjectId.toLowerCase().includes(section.name.toLowerCase())
                );
                if (foundSection && foundSection.questions.length > 0) break;
              }
            }
            if (foundSection) {
              questionCount = foundSection.questions.length;
            }
          }
        }

        // Check if this is a resume
        let isResume = false;
        if (sessionId) {
          const existingSession = await SessionService.loadSession(sessionId);
          isResume = !!(existingSession && existingSession.currentQuestionIndex > 0);
        } else if (user) {
          // Check if there's an active session for this section
          const progressData = await SessionService.getUserProgress(
            user.id, 
            selectedProduct,
            testType as 'diagnostic' | 'practice' | 'drill'
          );
          const sectionProgress = progressData[sectionName];
          isResume = !!(sectionProgress && sectionProgress.status === 'in-progress' && sectionProgress.sessionId);
        }

        setSectionInfo({
          name: sectionName,
          questionCount,
          timeLimit,
          format,
          isResume
        });

      } catch (error) {
        console.error('Error loading section info:', error);
        // Fallback to test taking page
        handleStart();
      } finally {
        setLoading(false);
      }
    };

    loadSectionInfo();
  }, [testType, subjectId, sessionId, selectedProduct, sectionName, user]);

  const handleStart = () => {
    // Get testMode from query parameters and forward it
    const searchParams = new URLSearchParams(window.location.search);
    const testMode = searchParams.get('testMode');
    const testModeParam = testMode ? `&testMode=${testMode}` : '';
    
    console.log('🔄 INSTRUCTIONS: Forwarding testMode:', testMode);
    
    if (sessionId) {
      // Resume with session ID
      navigate(`/test/${testType}/${subjectId}/${sessionId}?sectionName=${encodeURIComponent(sectionName)}${testModeParam}`);
    } else {
      // Start new test
      navigate(`/test/${testType}/${subjectId}?sectionName=${encodeURIComponent(sectionName)}${testModeParam}`);
    }
  };

  const handleBack = () => {
    if (testType === 'diagnostic') {
      navigate('/dashboard/diagnostic');
    } else if (testType === 'practice') {
      navigate('/dashboard/practice');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test information...</p>
        </div>
      </div>
    );
  }

  if (!sectionInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading test information</p>
          <button 
            onClick={handleStart}
            className="px-4 py-2 bg-edu-teal text-white rounded"
          >
            Continue to Test
          </button>
        </div>
      </div>
    );
  }

  const properDisplayName = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;

  return (
    <TestInstructions
      testType={testType as 'diagnostic' | 'practice' | 'drill'}
      sectionName={sectionInfo.name}
      productType={properDisplayName}
      questionCount={sectionInfo.questionCount}
      timeLimit={sectionInfo.timeLimit}
      format={sectionInfo.format}
      onStart={handleStart}
      onBack={handleBack}
      isResume={sectionInfo.isResume}
    />
  );
};

export default TestInstructionsPage;