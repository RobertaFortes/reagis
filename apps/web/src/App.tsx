import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/presenter/LoginPage";
import HomePage from "@/pages/presenter/HomePage";
import SessionPage from "@/pages/presenter/SessionPage";
import CreateSessionPage from "@/pages/presenter/CreateSessionPage";
import SessionDetailPage from "@/pages/presenter/SessionDetailPage";
import JoinPage from "@/pages/participant/JoinPage";
import ParticipantSessionPage from "@/pages/participant/ParticipantSessionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Participant — sans auth, sans sidebar */}
        <Route path="/join" element={<JoinPage />} />
        <Route path="/session/:code/join" element={<ParticipantSessionPage />} />

        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Créateur — avec auth et sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/sessions" element={<SessionPage />} />
          <Route path="/sessions/new" element={<CreateSessionPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
