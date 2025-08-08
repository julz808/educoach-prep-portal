import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { TestTypeProvider } from "./context/TestTypeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { TutorialProvider } from "./components/Tutorial";
import { MarketingRoutes } from "@/routes/MarketingRoutes";
import { LearningRoutes } from "@/routes/LearningRoutes";
import { isLearningPlatform } from "@/utils/subdomain";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  const isLearning = isLearningPlatform();
  
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <UserProvider>
              <TestTypeProvider>
                <ProductProvider>
                  <TutorialProvider>
                    <BrowserRouter>
                      {isLearning ? <LearningRoutes /> : <MarketingRoutes />}
                    </BrowserRouter>
                    <Toaster />
                    <Sonner />
                  </TutorialProvider>
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
