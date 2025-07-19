import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Diagnostic from "./pages/Diagnostic";
import Drill from "./pages/Drill";
import PracticeTests from "./pages/PracticeTests";
import Insights from "./pages/Insights";
import TestTaking from "./pages/TestTaking";
import TestInstructionsPage from "./pages/TestInstructionsPage";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CourseDetail from "./pages/CourseDetail";
import EduTestGenerator from "./pages/EduTestGenerator";
import ProtectedRoute from "./components/ProtectedRoute";

// Debug import - remove after troubleshooting
import './debug-access-control';
import { UserProvider } from "./context/UserContext";
import { TestTypeProvider } from "./context/TestTypeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import AuthCallback from '@/pages/AuthCallback';
import ResetPassword from '@/pages/ResetPassword';
import Profile from '@/pages/Profile';
import PurchaseSuccess from '@/pages/PurchaseSuccess';

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <UserProvider>
              <TestTypeProvider>
                <ProductProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/course/:slug" element={<CourseDetail />} />
                      <Route path="/edutest-generator" element={<EduTestGenerator />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/auth/reset-password" element={<ResetPassword />} />
                      <Route path="/purchase-success" element={<PurchaseSuccess />} />
                      <Route element={<ProtectedRoute />}>
                        {/* Test instruction routes (outside of Layout) */}
                        <Route path="/test-instructions/:testType/:subjectId" element={<TestInstructionsPage />} />
                        <Route path="/test-instructions/:testType/:subjectId/:sessionId" element={<TestInstructionsPage />} />
                        
                        {/* Test-taking routes (outside of Layout) */}
                        <Route path="/test/:testType/:subjectId" element={<TestTaking />} />
                        <Route path="/test/:testType/:subjectId/:sectionId" element={<TestTaking />} />
                        <Route path="/test/:testType/:subjectId/:sectionId/:sessionId" element={<TestTaking />} />
                        
                        {/* Dashboard routes (inside Layout) */}
                        <Route path="/dashboard" element={<Layout />}>
                          <Route index element={<Dashboard />} />
                          <Route path="diagnostic" element={<Diagnostic />} />
                          <Route path="drill" element={<Drill />} />
                          <Route path="practice-tests" element={<PracticeTests />} />
                          <Route path="insights" element={<Insights />} />
                        </Route>
                        <Route path="/profile" element={<Profile />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </ProductProvider>
              </TestTypeProvider>
            </UserProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
