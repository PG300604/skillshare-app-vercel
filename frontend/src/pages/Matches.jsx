import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch match records
      const { data: matchRecords } = await supabase
        .from('matches')
        .select('target_id, created_at')
        .eq('user_id', session.user.id)
        .eq('direction', 'right');

      if (!matchRecords || matchRecords.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch profiles for those matches
      const targetIds = matchRecords.map(m => m.target_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', targetIds);

      if (profiles) {
        const formattedMatches = profiles.map((p, i) => {
          const matchRecord = matchRecords.find(m => m.target_id === p.id);
          const date = new Date(matchRecord?.created_at || Date.now());
          
          return {
            id: p.id,
            time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            kicker: "MATCH",
            name: p.name || "UNKNOWN USER",
            skill: p.skills ? p.skills[0] : "CREATOR",
            role: p.looking_for ? `Looking for ${p.looking_for}` : "Open to collaborate",
            color: i % 2 === 1 ? "var(--verge-ultraviolet)" : null
          };
        });
        setMatches(formattedMatches);
      }
      setLoading(false);
    }
    loadMatches();
  }, []);

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={styles.content}
      >
        <div style={styles.feedHeader}>
          <h1 className="font-display" style={styles.feedTitle}>YOUR MATCHES</h1>
          <div className="font-sans-light-caps" style={styles.feedSubtitle}>Collaborators Ready</div>
        </div>

        <div style={styles.storyStream}>
          <div style={styles.verticalRail} />
          
          {loading ? (
             <div className="font-mono" style={{color: 'var(--hazard-white)', paddingLeft: '32px'}}>LOADING...</div>
          ) : matches.length === 0 ? (
             <div className="font-mono" style={{color: 'var(--secondary-text)', paddingLeft: '32px'}}>NO MATCHES YET</div>
          ) : matches.map((match, i) => (
            <motion.div 
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3, ease: "easeOut" }}
              style={styles.streamItemContainer}
            >
              <div className="font-mono" style={styles.timestamp}>{match.time}</div>
              <div style={styles.marker} />
              
              <div style={{
                ...styles.storyCard,
                background: match.color || 'var(--canvas-black)',
                border: match.color ? 'none' : '1px solid var(--hazard-white)',
              }}>
                <div className="font-mono" style={{
                  ...styles.kicker,
                  color: match.color ? 'var(--hazard-white)' : 'var(--jelly-mint)'
                }}>
                  {match.kicker}
                </div>
                <h3 className="font-sans" style={{
                  ...styles.headline,
                  color: 'var(--hazard-white)'
                }}>
                  {match.name} // {match.skill}
                </h3>
                <p style={{
                  ...styles.deck,
                  color: match.color ? 'var(--muted-text)' : 'var(--secondary-text)'
                }}>
                  {match.role}
                </p>
                <div style={{ marginTop: '24px' }}>
                  <button 
                    className="verge-button" 
                    style={{ background: match.color ? 'var(--hazard-white)' : 'var(--jelly-mint)' }}
                    onClick={() => navigate(`/messages?chat=${match.id}`)}
                  >
                    MESSAGE
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '120px 24px 64px 24px', 
    maxWidth: '1280px',
    margin: '0 auto',
  },
  content: {
    maxWidth: '800px',
  },
  feedHeader: {
    marginBottom: '64px',
  },
  feedTitle: {
    fontSize: 'clamp(60px, 8vw, 90px)',
    margin: 0,
    lineHeight: 0.9,
    color: 'var(--hazard-white)',
  },
  feedSubtitle: {
    fontSize: '19px',
    marginTop: '16px',
    color: 'var(--secondary-text)',
  },
  storyStream: {
    position: 'relative',
    paddingLeft: '120px', 
  },
  verticalRail: {
    position: 'absolute',
    left: '90px',
    top: 0,
    bottom: 0,
    width: '1px',
    background: 'var(--purple-rule)',
  },
  streamItemContainer: {
    position: 'relative',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  timestamp: {
    position: 'absolute',
    left: '-120px',
    width: '80px',
    textAlign: 'right',
    fontSize: '11px',
    color: 'var(--secondary-text)',
    top: '32px',
  },
  marker: {
    position: 'absolute',
    left: '-30px', 
    top: '36px',
    width: '5px',
    height: '5px',
    background: 'var(--hazard-white)',
    borderRadius: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
  },
  storyCard: {
    width: '100%',
    borderRadius: 'var(--border-radius-card)',
    padding: '28px 32px',
    transition: 'var(--transition-smooth)',
  },
  kicker: {
    fontSize: '12px',
    marginBottom: '8px',
  },
  headline: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    lineHeight: 1.1,
    textTransform: 'uppercase',
  },
  deck: {
    fontSize: '16px',
    margin: 0,
    lineHeight: 1.6,
  }
};
