import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AppLayout } from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Organizations from "./pages/Organizations";
import Permissions from "./pages/Permissions";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import Scopes from "./pages/Scopes";
import Departments from "./pages/Departments";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
              path="/"
              element={
                <AppLayout>
                  <Index />
                </AppLayout>
              }
            />
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
            <Route
              path="/scopes"
              element={
                <AppLayout>
                  <Scopes />
                </AppLayout>
              }
            />
            <Route
              path="/departments"
              element={
                <AppLayout>
                  <Departments />
                </AppLayout>
              }
            />
            <Route
              path="/insights"
              element={
                <AppLayout>
                  <Insights />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
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
