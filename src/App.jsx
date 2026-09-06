import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import AdminDashboardView from './views/AdminDashboardView';
import NotificationsView from './views/NotificationsView';
import AdminNotificationSchedulesView from './views/AdminNotificationSchedulesView';
import ScheduleFormView from './views/ScheduleFormView';
import ScheduleDetailsView from './views/ScheduleDetailsView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100 bg-dark text-light app-wrapper">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<LandingView />} />
              <Route path="/notifications" element={<NotificationsView />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboardView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notification-schedules"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminNotificationSchedulesView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notification-schedules/new"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ScheduleFormView isEdit={false} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notification-schedules/:id"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ScheduleDetailsView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notification-schedules/:id/edit"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ScheduleFormView isEdit={true} />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
          <Analytics />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

