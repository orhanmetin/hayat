import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LogEntryPage } from "./pages/LogEntryPage";
import { HabitsPage } from "./pages/HabitsPage";
import { ManagementLayout } from "./pages/management/ManagementLayout";
import { WeeklyGoalsPanel } from "./components/management/WeeklyGoalsPanel";
import { ActivityTypesPanel } from "./components/management/ActivityTypesPanel";
import { AnecdotesPanel } from "./components/management/AnecdotesPanel";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/log" element={<LogEntryPage />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/management" element={<ManagementLayout />}>
                <Route index element={<Navigate to="goals" replace />} />
                <Route path="goals" element={<WeeklyGoalsPanel />} />
                <Route path="activity-types" element={<ActivityTypesPanel />} />
                <Route path="anecdotes" element={<AnecdotesPanel />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
