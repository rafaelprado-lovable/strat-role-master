import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Organizations from "./pages/Organizations";
import Permissions from "./pages/Permissions";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import Scopes from "./pages/Scopes";
import Departments from "./pages/Departments";
import Settings from "./pages/Settings";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";
import Changes from "./pages/Changes";
import Analyses from "./pages/Analyses";
import Plantoes from "./pages/Plantoes";
import CallResolution from "./pages/CallResolution";
import ChangesInExecution from "./pages/ChangesInExecution";
import SwapAlarms from "./pages/SwapAlarms";
import PostChange from "./pages/PostChange";
import Automations from "./pages/Automations";
import ChangeExecution from "./pages/ChangeExecution";
import ChangeExecutionCep from "./pages/ChangeExecutionCep";
import SanityCheck from "./pages/SanityCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/incidents"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Insights />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/automations"
              element={
                <AppLayout>
                  <Automations />
                </AppLayout>
              }
            />
            <Route
              path="/change-execution/:id"
              element={
                <AppLayout>
                  <ChangeExecution />
                </AppLayout>
              }
            />
            <Route
              path="/organizations"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Organizations />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-execution-cep/:id"
              element={
                <AppLayout>
                  <ChangeExecutionCep />
                </AppLayout>
              }
            />
            <Route
              path="/permissions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Permissions />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Roles />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scopes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Scopes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Departments />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pre/change"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Changes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/call/resolution"
              element={
                <AppLayout>
                  <CallResolution />
                </AppLayout>
              }
            />
            <Route
              path="/execution/changes"
              element={
                <AppLayout>
                  <ChangesInExecution />
                </AppLayout>
              }
            />
            <Route
              path="/sanity-check"
              element={
                <AppLayout>
                  <SanityCheck />
                </AppLayout>
              }
            />
            <Route
              path="/post/change"
              element={
                <AppLayout>
                  <PostChange />
                </AppLayout>
              }
            />
            <Route
              path="/plantoes"
              element={
                <AppLayout>
                  <Plantoes />
                </AppLayout>
              }
            />
            <Route
              path="/clear/swap/mw"
              element={
                <AppLayout>
                  <SwapAlarms />
                </AppLayout>
              }
            />
            <Route
              path="/incident/resolution"
              element={
                <AppLayout>
                  <CallResolution />
                </AppLayout>
              }
            />
            <Route
              path="/incident/analyse/mw"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analyses />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
