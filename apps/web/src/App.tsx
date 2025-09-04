import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import NewAgent from "./pages/NewAgent";
import FinalizedAgent from "./pages/FinalizedAgent";
import TestAgent from "./pages/TestAgent";
import Evaluate from "./pages/Evaluate";
import Integrations from "./pages/Integrations";
import Telephony from "./pages/Telephony";
import NotFound from "./pages/NotFound";
import BriefingRoom from "./pages/BriefingRoom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full flex-col">
            {/* Demo Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 text-center font-semibold shadow-lg relative z-50">
              <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
                <span className="text-lg">⚠️</span>
                <span>HACKATHON DEMO - Work in Progress | Not yet functional for production use</span>
                <span className="text-lg">⚠️</span>
              </div>
            </div>
            <div className="flex flex-1">
              <AppSidebar />
              <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/build" element={<Navigate to="/build/new" replace />} />
                <Route path="/build/new" element={<NewAgent />} />
                <Route path="/build/finalized" element={<FinalizedAgent />} />
                <Route path="/briefing-room" element={<BriefingRoom />} />
                <Route path="/evaluate" element={<Evaluate />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/telephony" element={<Telephony />} />
                <Route path="/test" element={<TestAgent />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
