/**
 * Marketing Site Routes (educourse.com.au)
 * Public-facing pages for marketing and sales
 */

import { Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import CourseDetail from '@/pages/CourseDetail';
import Auth from '@/pages/Auth';
import PurchaseSuccess from '@/pages/PurchaseSuccess';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';

export const MarketingRoutes = () => {
  return (
    <Routes>
      {/* Homepage */}
      <Route path="/" element={<Landing />} />
      
      {/* Course Landing Pages */}
      <Route path="/course/:slug" element={<CourseDetail />} />
      
      {/* Authentication */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Purchase Flow */}
      <Route path="/purchase-success" element={<PurchaseSuccess />} />
      
      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};