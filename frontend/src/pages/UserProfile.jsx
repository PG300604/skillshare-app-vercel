import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

export function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);
  const [matchStatus, setMatchStatus] = useState(null); // 'matched', 'passed', null
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Get current logged in user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionUser(session.user);
        
        // 2. Check if we already swiped on this user
        const { data: matchData } = await supabase
          .from('matches')
          .select('direction')
          .eq('user_id', session.user.id)
          .eq('target_id', id)
          .maybeSingle();
          
        if (matchData) {
          setMatchStatus(matchData.direction === 'right' ? 'matched' : 'passed');
        }
      }

      // 3. Fetch target user profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleSwipe = async (direction) => {
    if (!sessionUser) return;
    setSubmitting(true);
    
    const { error } = await supabase.from('matches').upsert({
      user_id: sessionUser.id,
      target_id: id,
      direction: direction,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id,target_id' }); // Assuming a composite unique key exists, otherwise it might just insert.
    // If no unique key exists, we should delete existing then insert, or just insert if it's append-only.
    // For safety, let's just insert for now.
    
    if (!error) {
      setMatchStatus(direction === 'right' ? 'matched' : 'passed');
    }
    setSubmitting(false);
  };

  if (loading) return <div style={styles.container}><div className="font-mono" style={{color: 'var(--hazard-white)'}}>LOADING PROFILE...</div></div>;
  if (!profile) return <div style={styles.container}><div className="font-mono" style={{color: 'var(--red-error)'}}>USER NOT FOUND</div></div>;

  const isMe = sessionUser?.id === profile.id;

  return (
    <div style={styles.container}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={styles.content}>
        
        {/* Header Section */}
        <div style={styles.headerCard}>
          <div style={styles.avatarRow}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={{...styles.avatar, background: 'var(--jelly-mint)'}} />
            )}
            <div style={styles.nameBlock}>
              <h1 className="font-display" style={styles.name}>{profile.full_name || profile.name || 'Anonymous'}</h1>
              <div className="font-mono" style={styles.username}>@{profile.username || 'unknown'}</div>
              {profile.looking_for && (
                <div style={styles.lookingFor}>Looking for: <span style={{color: 'var(--hazard-white)'}}>{profile.looking_for}</span></div>
              )}
            </div>
          </div>
          
          {/* Match Actions */}
          {!isMe && (
            <div style={styles.actions}>
              {matchStatus === 'matched' ? (
                <div className="font-mono" style={{color: 'var(--jelly-mint)', border: '1px solid', padding: '12px 24px', borderRadius: '30px'}}>
                  YOU MATCHED WITH THEM
                </div>
              ) : matchStatus === 'passed' ? (
                <div className="font-mono" style={{color: 'var(--secondary-text)', border: '1px solid', padding: '12px 24px', borderRadius: '30px'}}>
                  YOU PASSED
                </div>
              ) : (
                <div style={{display: 'flex', gap: '16px'}}>
                  <button 
                    className="verge-button font-mono" 
                    style={{background: 'transparent', border: '1px solid var(--hazard-white)', color: 'var(--hazard-white)'}}
                    onClick={() => handleSwipe('left')}
                    disabled={submitting}
                  >
                    PASS
                  </button>
                  <button 
                    className="verge-button font-mono" 
                    style={{background: 'var(--jelly-mint)', color: 'var(--absolute-black)'}}
                    onClick={() => handleSwipe('right')}
                    disabled={submitting}
                  >
                    MATCH
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.columns}>
          {/* Left Column */}
          <div style={styles.leftCol}>
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div style={styles.section}>
                <h3 className="font-mono" style={styles.sectionTitle}>SKILLS</h3>
                <div style={styles.tagsContainer}>
                  {profile.skills.map((s, i) => (
                    <div key={i} style={styles.skillPill}>{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={styles.rightCol}>
            {/* Experiences */}
            {profile.experiences && profile.experiences.length > 0 && (
              <div style={styles.section}>
                <h3 className="font-mono" style={styles.sectionTitle}>EXPERIENCE</h3>
                <div style={styles.list}>
                  {profile.experiences.map((exp, i) => (
                    <div key={i} style={styles.listItem}>
                      <div className="font-display" style={{fontSize: '24px', color: 'var(--hazard-white)', lineHeight: 1}}>{exp.role}</div>
                      <div className="font-mono" style={{color: 'var(--jelly-mint)', fontSize: '14px', marginTop: '4px'}}>{exp.company}</div>
                      <div style={{color: 'var(--secondary-text)', fontSize: '12px', marginTop: '4px'}}>{exp.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <div style={styles.section}>
                <h3 className="font-mono" style={styles.sectionTitle}>PROJECTS</h3>
                <div style={styles.list}>
                  {profile.projects.map((proj, i) => (
                    <div key={i} style={styles.listItem}>
                      <div className="font-display" style={{fontSize: '24px', color: 'var(--hazard-white)', lineHeight: 1}}>{proj.title}</div>
                      <div style={{color: 'var(--secondary-text)', fontSize: '14px', marginTop: '8px'}}>{proj.description}</div>
                      {proj.url && (
                        <a href={proj.url.startsWith('http') ? proj.url : `https://${proj.url}`} target="_blank" rel="noreferrer" className="font-mono" style={{color: 'var(--verge-ultraviolet)', fontSize: '12px', marginTop: '8px', display: 'block', textDecoration: 'none'}}>
                          VIEW PROJECT ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '120px 24px 64px 24px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  headerCard: {
    background: 'var(--canvas-black)',
    border: '1px solid var(--hazard-white)',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px'
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px'
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  name: {
    fontSize: '64px',
    margin: 0,
    color: 'var(--hazard-white)',
    lineHeight: 0.9
  },
  username: {
    color: 'var(--jelly-mint)',
    fontSize: '18px'
  },
  lookingFor: {
    color: 'var(--secondary-text)',
    fontSize: '14px',
    marginTop: '8px'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
  },
  columns: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap'
  },
  leftCol: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  rightCol: {
    flex: '2 1 400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  section: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '32px',
  },
  sectionTitle: {
    color: 'var(--hazard-white)',
    fontSize: '14px',
    letterSpacing: '2px',
    marginBottom: '24px',
    opacity: 0.5
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  skillPill: {
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--hazard-white)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  listItem: {
    borderLeft: '2px solid var(--verge-ultraviolet)',
    paddingLeft: '16px'
  }
};
