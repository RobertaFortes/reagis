import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/presenter/LoginPage";
import RequireAuth from "@/components/RequireAuth";
import Spinner from "@/components/Spinner";

const JoinPage = lazy(() => import("@/pages/participant/JoinPage"));
const AppLayout = lazy(() => import("@/components/AppLayout"));
const HomePage = lazy(() => import("@/pages/presenter/HomePage"));
const SessionPage = lazy(() => import("@/pages/presenter/SessionPage"));
const CreateSessionPage = lazy(() => import("@/pages/presenter/CreateSessionPage"));
const SessionDetailPage = lazy(() => import("@/pages/presenter/SessionDetailPage"));
const EditSessionPage = lazy(() => import("@/pages/presenter/EditSessionPage"));
const PresentationPage = lazy(() => import("@/pages/presenter/PresentationPage"));
const ParticipantSessionPage = lazy(() => import("@/pages/participant/ParticipantSessionPage"));

function App() {
  

  return (
    <BrowserRouter>    
      <Suspense fallback={<Spinner fullScreen />}>
        <Routes>
          {/* Participant — sans auth, sans sidebar */}
          <Route path="/join" element={<JoinPage />} />
          <Route path="/session/:code" element={<ParticipantSessionPage />} />

          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Créateur — protégé */}
          <Route element={<RequireAuth />}>
            <Route path="/sessions/:id/present" element={<PresentationPage />} />
          </Route>

          {/* Créateur — avec auth et sidebar */}
          <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/sessions" element={<SessionPage />} />
            <Route path="/sessions/new" element={<CreateSessionPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />
            <Route path="/sessions/:id/edit" element={<EditSessionPage />} />
          </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
