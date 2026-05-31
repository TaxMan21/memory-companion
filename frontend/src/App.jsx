import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Demo from './pages/Demo.jsx';
import Memories from './pages/Memories.jsx';
import MemoryVault from './pages/MemoryVault.jsx';
import AICompanion from './pages/AICompanion.jsx';
import Goals from './pages/Goals.jsx';
import Journal from './pages/Journal.jsx';
import Timeline from './pages/Timeline.jsx';
import Relationships from './pages/Relationships.jsx';
import KnowledgeBase from './pages/KnowledgeBase.jsx';
import Tasks from './pages/Tasks.jsx';
import Insights from './pages/Insights.jsx';
import DailyBriefing from './pages/DailyBriefing.jsx';
import Settings from './pages/Settings.jsx';
import Subscription from './pages/Subscription.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import CookieConsent from './components/CookieConsent.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <CookieConsent />
      <div className="pt-16">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/demo" element={
          <ProtectedRoute>
            <Demo />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/memories" element={
          <ProtectedRoute>
            <Memories />
          </ProtectedRoute>
        } />
        <Route path="/memory-vault" element={
          <ProtectedRoute>
            <MemoryVault />
          </ProtectedRoute>
        } />
        <Route path="/ai-companion" element={
          <ProtectedRoute>
            <AICompanion />
          </ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        } />
        <Route path="/journal" element={
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        } />
        <Route path="/timeline" element={
          <ProtectedRoute>
            <Timeline />
          </ProtectedRoute>
        } />
        <Route path="/relationships" element={
          <ProtectedRoute>
            <Relationships />
          </ProtectedRoute>
        } />
        <Route path="/knowledge-base" element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        } />
        <Route path="/daily-briefing" element={
          <ProtectedRoute>
            <DailyBriefing />
          </ProtectedRoute>
        } />
        <Route path="/subscription" element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </AuthProvider>
  );
}
