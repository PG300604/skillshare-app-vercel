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
      // Fetch all profiles except the current user
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentSession.user.id);
      
      if (data) {
        const formattedDeck = data.map(u => ({
          id: u.id,
          name: u.name || "A Creator",
          role: u.looking_for ? `Looking for ${u.looking_for}` : 'Collaborator',
          location: 'Global',
          skills: u.skills || ['Creator'],
          match: 85 + Math.floor(Math.random() * 10),
          avatar: "🧑‍💻",
        }));
        setDeck(formattedDeck);
      }
    } catch (err) {
      console.error("Failed to fetch from supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction, swipedUser) => {
    setDeckIndex(i => i + 1);
    
    if (direction === "right" && swipedUser && session) {
      try {
        await supabase
          .from("matches")
          .insert([{ user_id: session.user.id, target_id: swipedUser.id, direction: 'right' }]);

        const mutualMatchTriggered = Math.random() > 0.3; 
        if (mutualMatchTriggered) {
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
