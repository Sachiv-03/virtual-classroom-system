import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CreateCourse from "./pages/CreateCourse";
import Syllabus from "./pages/Syllabus";
import Gamification from "./pages/Gamification";
import LiveClassroom from "./pages/LiveClassroom";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import Assignments from "./pages/Assignments";
import Settings from "./pages/Settings";
import AdminSyllabusUpload from "./pages/AdminSyllabusUpload";
import SyllabusViewer from "./pages/SyllabusViewer";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
      <Route path="/courses/new" element={<PrivateRoute><CreateCourse /></PrivateRoute>} />
      <Route path="/courses/:courseId" element={<PrivateRoute><Syllabus /></PrivateRoute>} />
      <Route path="/achievements" element={<PrivateRoute><Gamification /></PrivateRoute>} />
      <Route path="/live" element={<PrivateRoute><LiveClassroom /></PrivateRoute>} />
      <Route path="/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/assignments" element={<PrivateRoute><Assignments /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      {/* New Syllabus Routes */}
      <Route path="/admin/syllabus/upload" element={<PrivateRoute><AdminSyllabusUpload /></PrivateRoute>} />
      <Route path="/syllabus/view/:id" element={<PrivateRoute><SyllabusViewer /></PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
