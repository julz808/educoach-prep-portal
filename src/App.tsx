
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Drill from "./pages/Drill";
import MockTests from "./pages/MockTests";
import Diagnostic from "./pages/Diagnostic";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";
import { TestTypeProvider } from "./contexts/TestTypeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TestTypeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="drill" element={<Drill />} />
              <Route path="mock-tests" element={<MockTests />} />
              <Route path="diagnostic" element={<Diagnostic />} />
              <Route path="insights" element={<Insights />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TestTypeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
