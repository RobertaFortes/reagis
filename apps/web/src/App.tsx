
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/sessions" element={<SessionPage />} />
      </Routes>
    </BrowserRouter>
  );  
}

export default App;
