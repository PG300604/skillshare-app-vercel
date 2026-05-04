import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export function SetupProfile() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    city: 'San Francisco, CA', // Defaulting to SF for lat/lng mocking
    skills: [],
    tags: []
  });

  // Local state for adding arrays
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentProficiency, setCurrentProficiency] = useState('Intermediate');
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
      } else {
        setSession(session);
        // Pre-fill full name from OAuth if available
        if (session.user.user_metadata?.full_name) {
          setFormData(prev => ({ ...prev, fullName: session.user.user_metadata.full_name }));
        }
      }
      setLoading(false);
    });
  }, [navigate]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const addSkill = () => {
    if (currentSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, { name: currentSkill.trim(), proficiency: currentProficiency }]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // 1. Mock Lat/Lng based on City (for demo purposes)
      // In a real app, you would use a Geocoding API
      const lat = 37.7749; 
      const lng = -122.4194;

      // 2. Insert Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          username: formData.username,
          full_name: formData.fullName,
          latitude: lat,
          longitude: lng,
          name: formData.fullName // Home.jsx expects 'name' column? Wait, User.java says 'full_name' but Home.jsx selects 'name'. We should insert both just in case, or match schema.
        });

      if (profileError) throw profileError;

      // 3. Insert Skills
      if (formData.skills.length > 0) {
        const skillsToInsert = formData.skills.map(s => ({
          user_id: session.user.id,
          skill_name: s.name,
          proficiency_level: s.proficiency
        }));
        await supabase.from('user_skills').insert(skillsToInsert);
      }

      // 4. Insert Tags
      if (formData.tags.length > 0) {
        const tagsToInsert = formData.tags.map(t => ({
          user_id: session.user.id,
          tag: t
        }));
        await supabase.from('profile_tags').insert(tagsToInsert);
      }

      // Navigate to Dashboard
      window.location.href = '/home';

    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.root}></div>;

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div className="font-display" style={{color: 'var(--jelly-mint)', fontSize: '24px'}}>SETUP YOUR PROFILE</div>
          <div className="font-mono" style={{color: 'var(--secondary-text)'}}>STEP {step} OF 4</div>
        </div>

        <div style={styles.card}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={styles.stepContainer}>
                <h2 className="font-display" style={styles.stepTitle}>WHO ARE YOU?</h2>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>FULL NAME</label>
                  <input style={styles.input} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Jane Doe" />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>USERNAME</label>
                  <input style={styles.input} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="janedoe" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={styles.stepContainer}>
                <h2 className="font-display" style={styles.stepTitle}>WHERE ARE YOU?</h2>
                <p style={{color: 'var(--secondary-text)', marginTop: 0}}>Used for local matching.</p>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>CITY</label>
                  <input style={styles.input} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="San Francisco, CA" />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={styles.stepContainer}>
                <h2 className="font-display" style={styles.stepTitle}>YOUR SKILLS</h2>
                <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                  <input style={{...styles.input, flex: 1}} value={currentSkill} onChange={e => setCurrentSkill(e.target.value)} placeholder="e.g. React, Java, UI Design" />
                  <select style={styles.input} value={currentProficiency} onChange={e => setCurrentProficiency(e.target.value)}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                  <button className="verge-button" style={{padding: '0 24px'}} onClick={addSkill}>ADD</button>
                </div>
                
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {formData.skills.map((s, i) => (
                    <div key={i} style={styles.pill}>
                      {s.name} ({s.proficiency})
                      <span style={{marginLeft: '8px', cursor: 'pointer', color: 'var(--red-error)'}} onClick={() => removeSkill(i)}>×</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={styles.stepContainer}>
                <h2 className="font-display" style={styles.stepTitle}>YOUR VIBE</h2>
                <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
                  <input style={{...styles.input, flex: 1}} value={currentTag} onChange={e => setCurrentTag(e.target.value)} placeholder="e.g. Night Owl, Coffee Addict" />
                  <button className="verge-button" style={{padding: '0 24px'}} onClick={addTag}>ADD</button>
                </div>
                
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {formData.tags.map((t, i) => (
                    <div key={i} style={styles.pill}>
                      {t}
                      <span style={{marginLeft: '8px', cursor: 'pointer', color: 'var(--red-error)'}} onClick={() => removeTag(i)}>×</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={styles.footer}>
          {step > 1 ? (
            <button className="verge-button" style={{background: 'transparent', border: '1px solid var(--hazard-white)', color: 'var(--hazard-white)'}} onClick={handleBack}>BACK</button>
          ) : <div></div>}
          
          {step < 4 ? (
            <button className="verge-button" onClick={handleNext}>NEXT</button>
          ) : (
            <button className="verge-button" style={{background: 'var(--jelly-mint)', color: 'var(--absolute-black)'}} onClick={handleComplete} disabled={saving}>
              {saving ? 'SAVING...' : 'COMPLETE PROFILE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--canvas-black)",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--hazard-white)",
    borderRadius: "16px",
    padding: "40px 32px",
    minHeight: "350px"
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  stepTitle: {
    fontSize: '48px',
    color: 'var(--hazard-white)',
    margin: 0,
    lineHeight: 1
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: 'var(--jelly-mint)',
    fontFamily: 'monospace',
    fontSize: '12px',
    letterSpacing: '1px'
  },
  input: {
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(0, 0, 0, 0.5)",
    color: "var(--hazard-white)",
    fontSize: "16px",
    outline: "none",
  },
  pill: {
    background: 'var(--verge-ultraviolet)',
    color: 'var(--hazard-white)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};
