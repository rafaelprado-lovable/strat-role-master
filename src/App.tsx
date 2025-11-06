import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Organizations from "./pages/Organizations";
import Permissions from "./pages/Permissions";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/organizations"
            element={
              <AppLayout>
                <Organizations />
              </AppLayout>
            }
          />
          <Route
            path="/permissions"
            element={
              <AppLayout>
                <Permissions />
              </AppLayout>
            }
          />
          <Route
            path="/roles"
            element={
              <AppLayout>
                <Roles />
              </AppLayout>
            }
          />
          <Route
            path="/users"
            element={
              <AppLayout>
                <Users />
              </AppLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
