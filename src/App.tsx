import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetail from "./pages/DeviceDetail";
import RoomDetail from "./pages/RoomDetail";
import Schedule from "./pages/Schedule";
import Scenes from "./pages/Scenes";
import Automations from "./pages/Automations";
import FloorPlan from "./pages/FloorPlan";
import PinGroups from "./pages/PinGroups";
import Statistics from "./pages/Statistics";
import PairingWizard from "./pages/PairingWizard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><p className="text-gray-500">Loading...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <WebSocketProvider>
    <DeviceProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:deviceId" element={<DeviceDetail />} />
          <Route path="rooms/:roomId" element={<RoomDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="scenes" element={<Scenes />} />
          <Route path="automations" element={<Automations />} />
          <Route path="floor-plan" element={<FloorPlan />} />
          <Route path="pin-groups" element={<PinGroups />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="pair-device" element={<PairingWizard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </DeviceProvider>
    </WebSocketProvider>
  );
}

function LoginPage() { const { isAuthenticated, loading } = useAuth(); if (loading) return null; if (isAuthenticated) return <Navigate to="/" replace />; return <Login />; }
function SignUpPage() { const { isAuthenticated, loading } = useAuth(); if (loading) return null; if (isAuthenticated) return <Navigate to="/" replace />; return <SignUp />; }

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
