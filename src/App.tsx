import { useState } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import Login from "./components/Login";
import Shell, { View } from "./components/Shell";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Chat from "./components/Chat";
import Insights from "./components/Insights";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import DesignSystem from "./components/DesignSystem";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>("home");

  return (
    <LanguageProvider>
      {!authed ? (
        <Login onLogin={() => setAuthed(true)} />
      ) : (
        <Shell view={view} setView={setView} onLogout={() => { setAuthed(false); setView("home"); }}>
          {view === "home" && <Dashboard go={setView} />}
          {view === "profile" && <Profile />}
          {view === "chat" && <Chat />}
          {view === "insights" && <Insights />}
          {view === "reports" && <Reports />}
          {view === "settings" && <Settings />}
          {view === "system" && <DesignSystem />}
        </Shell>
      )}
    </LanguageProvider>
  );
}
