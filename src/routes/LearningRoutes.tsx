/**
 * Learning Platform Routes (learning.educourse.com.au)  
 * Authenticated user dashboard and learning tools
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CrossDomainProtectedRoute from '@/components/CrossDomainProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Diagnostic from '@/pages/Diagnostic';
import Drill from '@/pages/Drill';
import TestTaking from '@/pages/TestTaking';
import Insights from '@/pages/Insights';
import PracticeTests from '@/pages/PracticeTests';
import Profile from '@/pages/Profile';
import TestInstructionsPage from '@/pages/TestInstructionsPage';
import AuthCallback from '@/pages/AuthCallback';

export const LearningRoutes = () => {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Auth callback (for cross-domain auth) */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected Learning Platform Routes with Outlet pattern */}
      <Route element={<CrossDomainProtectedRoute />}>
        {/* Dashboard routes (inside Layout) */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="diagnostic" element={<Diagnostic />} />
          <Route path="drill" element={<Drill />} />
          <Route path="practice-tests" element={<PracticeTests />} />
          <Route path="insights" element={<Insights />} />
        </Route>
        
        {/* Test instruction routes (outside of Layout) */}
        <Route path="/test-instructions/:testType/:subjectId" element={<TestInstructionsPage />} />
        <Route path="/test-instructions/:testType/:subjectId/:sessionId" element={<TestInstructionsPage />} />
        
        {/* Test-taking routes (outside of Layout) */}
        <Route path="/test/:testType/:subjectId" element={<TestTaking />} />
        <Route path="/test/:testType/:subjectId/:sectionId" element={<TestTaking />} />
        <Route path="/test/:testType/:subjectId/:sectionId/:sessionId" element={<TestTaking />} />
        
        {/* Profile route */}
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};