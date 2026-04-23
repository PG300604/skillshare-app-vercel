import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

export function Home() {
  const [stream, setStream] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("CREATOR");

  useEffect(() => {
    async function loadStream() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const events = [];

      // Fetch my profile for the welcome message
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
      
      if (myProfile?.name) {
        setUserName(myProfile.name.toUpperCase());
      }

      // Fetch recent matches
      const { data: matchRecords } = await supabase
        .from('matches')
        .select('target_id, created_at')
        .eq('user_id', session.user.id)
        .eq('direction', 'right')
        .order('created_at', { ascending: false })
        .limit(10);

      if (matchRecords && matchRecords.length > 0) {
        const targetIds = matchRecords.map(m => m.target_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', targetIds);
        
        if (profiles) {
          matchRecords.forEach(m => {
            const p = profiles.find(pr => pr.id === m.target_id);
            if (p) {
              const date = new Date(m.created_at);
              events.push({
                id: `match_${m.target_id}_${date.getTime()}`,
                timestamp: date.getTime(),
                time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                kicker: "NEW MATCH",
                headline: `YOU MATCHED WITH ${p.name || 'A CREATOR'}`,
                deck: "Check your Messages tab to say hi.",
                color: null
              });
            }
          });
        }
      }

      // Sort by timestamp desc
      events.sort((a, b) => b.timestamp - a.timestamp);
      
      setStream(events);
      setLoading(false);
    }
    loadStream();
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
          <div className="font-mono" style={{color: 'var(--jelly-mint)', marginBottom: '8px', fontSize: '28px'}}>WELCOME {userName}</div>
          <h1 className="font-display" style={styles.feedTitle}>YOUR TIMELINE</h1>
          <div className="font-sans-light-caps" style={styles.feedSubtitle}>Latest Activity</div>
        </div>

        <div style={styles.storyStream}>
          <div style={styles.verticalRail} />
          
          {loading ? (
             <div className="font-mono" style={{color: 'var(--hazard-white)', paddingLeft: '32px'}}>LOADING STREAM...</div>
          ) : stream.length === 0 ? (
             <div className="font-mono" style={{color: 'var(--secondary-text)', paddingLeft: '32px'}}>NO ACTIVITY YET. START SWIPING!</div>
          ) : stream.map((story, i) => (
            <motion.div 
              key={story.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3, ease: "easeOut" }}
              style={styles.streamItemContainer}
            >
              <div className="font-mono" style={styles.timestamp}>{story.time}</div>
              <div style={styles.marker} />
              
              <div style={{
                ...styles.storyCard,
                background: story.color || 'var(--canvas-black)',
                border: story.color ? 'none' : '1px solid var(--hazard-white)',
              }}>
                <div className="font-mono" style={{
                  ...styles.kicker,
                  color: story.color ? 'var(--hazard-white)' : 'var(--jelly-mint)'
                }}>
                  {story.kicker}
                </div>
                <h3 className="font-sans" style={{
                  ...styles.headline,
                  color: 'var(--hazard-white)'
                }}>
                  {story.headline}
                </h3>
                <p style={{
                  ...styles.deck,
                  color: story.color ? 'var(--muted-text)' : 'var(--secondary-text)'
                }}>
                  {story.deck}
                </p>
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
