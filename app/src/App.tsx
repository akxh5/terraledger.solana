import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolanaWalletProvider } from "@/context/WalletContext";
import { WalletModalProvider } from "@/hooks/useWalletModal";
import { ParcelsProvider } from "@/context/ParcelsContext";
import { RoleGuard } from "@/components/RoleGuard";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import VerifierPage from "./pages/VerifierPage.tsx";
import AuthorityPage from "./pages/AuthorityPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
      <ParcelsProvider>
        <WalletModalProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <RoleGuard role="owner">
                      <Dashboard />
                    </RoleGuard>
                  } 
                />
                <Route 
                  path="/verifier" 
                  element={
                    <RoleGuard role="verifier">
                      <VerifierPage />
                    </RoleGuard>
                  } 
                />
                <Route 
                  path="/authority" 
                  element={
                    <RoleGuard role="authority">
                      <AuthorityPage />
                    </RoleGuard>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WalletModalProvider>
      </ParcelsProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
