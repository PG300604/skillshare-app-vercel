import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { SwipeCard } from "./SwipeCard";
import { MatchOverlay } from "./MatchOverlay";

export function Experience() {
  const [deck, setDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [matchUser, setMatchUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState(null);

  useEffect(() => {
    document.title = "SkillShare | Discover";
  }, []);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      fetchMatches(session);
    }
    loadSession();
  }, []);

  const fetchMatches = async (currentSession) => {
    if (!currentSession) {
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/matches/discover`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        const formattedDeck = data.map(u => ({
          id: u.id,
          name: u.fullName || u.username || "A Creator",
          role: 'Collaborator', // Add looking_for to User model later if needed
          location: 'Global',
          skills: u.skills ? u.skills.map(s => s.skillName) : ['Creator'],
          tags: u.tags || [],
          match: 85 + Math.floor(Math.random() * 10),
          avatar: "🧑‍💻",
        }));
        setDeck(formattedDeck);
      }
    } catch (err) {
      console.error("Failed to fetch from Spring Boot API:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction, swipedUser) => {
    setDeckIndex(i => i + 1);
    
    if (direction === "right" && swipedUser && session) {
      try {
        // Insert the current user's right swipe
        await supabase
          .from("matches")
          .insert([{ user_id: session.user.id, target_id: swipedUser.id, direction: 'right' }]);

        // Check for a mutual match: Did the target user already swipe right on us?
        const { data: mutualSwipe } = await supabase
          .from("matches")
          .select("id")
          .eq("user_id", swipedUser.id)
          .eq("target_id", session.user.id)
          .eq("direction", "right")
          .maybeSingle();

        if (mutualSwipe) {
          // It's a real match!
          setTimeout(() => setMatchUser(swipedUser), 300); 
        }
      } catch (err) {
        console.error("Match error:", err);
      }
    }
  };

  return (
    <div style={styles.root}>
      <AnimatePresence>
        {matchUser && (
          <MatchOverlay user={matchUser} onClose={() => setMatchUser(null)} />
        )}
      </AnimatePresence>

      <div style={styles.cardContainer}>
        {loading ? (
          <div className="font-mono" style={{color: 'var(--hazard-white)'}}>LOADING_PROFILES</div>
        ) : deckIndex < deck.length ? (
          <SwipeCard
            key={deck[deckIndex].id || deckIndex}
            user={deck[deckIndex]}
            onSwipe={(dir) => handleSwipe(dir, deck[deckIndex])}
          />
        ) : (
          <div className="font-mono" style={{color: 'var(--hazard-white)', textAlign: 'center'}}>
            <div style={{fontSize: '40px', marginBottom: '16px'}}>✨</div>
            NO MORE PROFILES
          </div>
        )}
      </div>
      
      {deckIndex < deck.length && !loading && (
        <div className="font-mono" style={styles.hintBar}>
          <span style={{ color: 'var(--verge-ultraviolet)' }}>← PASS</span>
          <span style={{ color: 'var(--jelly-mint)' }}>MATCH →</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--canvas-black)",
    overflow: "hidden",
  },
  cardContainer: {
    position: 'relative',
    width: '320px',
    height: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBar: {
    marginTop: '40px',
    display: "flex",
    gap: "32px",
    fontSize: "12px",
    fontWeight: "700",
  }
};
