# Phase 1 Implementation: Application Split Preparation

## 📂 **File Organization Plan**

### **Marketing Site Files (educourse.com.au)**
```
Marketing Pages:
- src/pages/Landing.tsx ✅
- src/pages/CourseDetail.tsx ✅  
- src/pages/Auth.tsx ✅
- src/pages/PurchaseSuccess.tsx ✅
- src/pages/NotFound.tsx ✅

Marketing Components:
- src/components/Header.tsx (modified for marketing)
- src/components/RegistrationSuccessModal.tsx ✅
- All src/components/ui/* ✅

Shared Assets:
- public/images/* ✅
- src/config/stripeConfig.ts ✅
- src/services/stripeService.ts ✅
```

### **Learning Platform Files (learning.educourse.com.au)**
```
Learning Pages:
- src/pages/Dashboard.tsx ✅
- src/pages/Diagnostic.tsx ✅  
- src/pages/Drill.tsx ✅
- src/pages/TestTaking.tsx ✅
- src/pages/Insights.tsx ✅
- src/pages/PracticeTests.tsx ✅
- src/pages/Profile.tsx ✅

Learning Components:
- src/components/Navigation.tsx ✅
- src/components/Layout.tsx ✅
- src/components/ProtectedRoute.tsx ✅
- src/components/TestInstructions.tsx ✅
- src/components/EnhancedTestInterface.tsx ✅
- src/components/InteractiveInsightsDashboard.tsx ✅
- src/components/WritingAssessmentFeedback.tsx ✅
- All src/components/ui/* ✅

Admin/Development (Optional):
- src/pages/BulkGeneration.tsx
- src/components/DeveloperTools.tsx
- src/components/QuestionGenerationAdmin.tsx
```

## 🛠️ **What I'm Implementing Now**

### **Step 1: Create Subdomain Routing Logic**