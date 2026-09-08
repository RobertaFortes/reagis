import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/presenter/LoginPage";
import HomePage from "@/pages/presenter/HomePage";
import SessionPage from "@/pages/presenter/SessionPage";
import CreateSessionPage from "@/pages/presenter/CreateSessionPage";
import SessionDetailPage from "@/pages/presenter/SessionDetailPage";
import EditSessionPage from "@/pages/presenter/EditSessionPage";
import PresentationPage from "@/pages/presenter/PresentationPage";
import JoinPage from "@/pages/participant/JoinPage";
import ParticipantSessionPage from "@/pages/participant/ParticipantSessionPage";

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
