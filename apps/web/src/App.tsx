import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import CreateSessionPage from "./pages/CreateSessionPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import JoinPage from "./pages/JoinPage";
import ParticipantSessionPage from "./pages/ParticipantSessionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Participant — sans auth, sans sidebar */}
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/session/:code" element={<ParticipantSessionPage />} />

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
