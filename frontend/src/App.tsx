import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import SpaceDetail from "./pages/SpaceDetail";
import SpaceAdmin from "./pages/SpaceAdmin";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider storageKey="campusloop-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Layout wrapper for app chrome under root */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Index />} />
                <Route path="post/:postId" element={<PostDetail />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="explore" element={<Explore />} />
                <Route path="space/:spaceSlug" element={<SpaceDetail />} />
                <Route path="space/:spaceSlug/admin" element={<SpaceAdmin />} />
              </Route>
              {/* Non-layout routes (auth, 404) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
