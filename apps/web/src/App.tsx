import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Build from "./pages/Build";
import NewAgent from "./pages/NewAgent";
import FinalizedAgent from "./pages/FinalizedAgent";
import TestAgent from "./pages/TestAgent";
import Evaluate from "./pages/Evaluate";
import Integrations from "./pages/Integrations";
import Telephony from "./pages/Telephony";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/build" element={<Build />} />
                <Route path="/build/new" element={<NewAgent />} />
                <Route path="/build/agent" element={<FinalizedAgent />} />
                <Route path="/test-agent" element={<TestAgent />} />
                <Route path="/evaluate" element={<Evaluate />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/telephony" element={<Telephony />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
