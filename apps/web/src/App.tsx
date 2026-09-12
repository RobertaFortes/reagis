import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/presenter/LoginPage";

const JoinPage = lazy(() => import("@/pages/participant/JoinPage"));
//import JoinPage from "@/pages/participant/JoinPage";
const AppLayout = lazy(() => import("@/components/AppLayout"));
//import AppLayout from "@/components/AppLayout";
const HomePage = lazy(() => import("@/pages/presenter/HomePage"));
//import HomePage from "@/pages/presenter/HomePage";
const SessionPage = lazy(() => import("@/pages/presenter/SessionPage"));
//import SessionPage from "@/pages/presenter/SessionPage";
const CreateSessionPage = lazy(() => import("@/pages/presenter/CreateSessionPage"));
//import CreateSessionPage from "@/pages/presenter/CreateSessionPage";
const SessionDetailPage = lazy(() => import("@/pages/presenter/SessionDetailPage"));
//import SessionDetailPage from "@/pages/presenter/SessionDetailPage";
const EditSessionPage = lazy(() => import("@/pages/presenter/EditSessionPage"));
//import EditSessionPage from "@/pages/presenter/EditSessionPage";
const PresentationPage = lazy(() => import("@/pages/presenter/PresentationPage"));
//import PresentationPage from "@/pages/presenter/PresentationPage";
const ParticipantSessionPage = lazy(() => import("@/pages/participant/ParticipantSessionPage"));
//import ParticipantSessionPage from "@/pages/participant/ParticipantSessionPage";

function App() {
  

  return (
    <BrowserRouter>    
      <Suspense fallback={<div>Chargement...</div>}>
        <Routes>
          {/* Participant — sans auth, sans sidebar */}
          <Route path="/join" element={<JoinPage />} />
          <Route path="/session/:code" element={<ParticipantSessionPage />} />
          <Route path="/sessions/:id/present" element={<PresentationPage />} />

          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Créateur — avec auth et sidebar */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/sessions" element={<SessionPage />} />
            <Route path="/sessions/new" element={<CreateSessionPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/sessions/:id/edit" element={<EditSessionPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
