import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Explore } from "./pages/Explore";
import { Matches } from "./pages/Matches";
import { Messages } from "./pages/Messages";
import { Profile } from "./pages/Profile";
import { SetupProfile } from "./pages/SetupProfile";
import { UserProfile } from "./pages/UserProfile";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkSessionAndProfile = async (currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", currentSession.user.id)
          .maybeSingle();
        setProfileExists(!!data);
      } else {
        setProfileExists(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkSessionAndProfile(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSessionAndProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || (session && profileExists === null)) {
    return <div style={{ background: "#12121e", height: "100vh" }} />;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Authenticated but no profile -> Force Setup
  if (!profileExists) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupProfile />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  // Authenticated and Profile exists
  return (
    <div style={{ margin: 0, padding: 0 }}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/setup" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Navbar />
    </div>
  );
}

export default App;
