import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

export function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  
  const [fullName, setFullName] = useState("");
  const [skills, setSkills] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.name || "");
        setSkills(data.skills ? data.skills.join(", ") : "");
        setLookingFor(data.looking_for || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (data) {
        setAvatarUrl(data.publicUrl);
        // Automatically save the avatar URL to the profile
        await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      alert(`Error uploading avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: fullName,
      skills: skillsArray,
      looking_for: lookingFor,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });
    
    setSaving(false);
    if (error) {
      alert(`Error saving profile: ${error.message}`);
      console.error(error);
    } else {
      alert("PROFILE SAVED");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={styles.content}
      >
        <h1 className="font-display" style={styles.title}>YOUR PROFILE</h1>
        
        <div style={styles.formCard}>
          {loading ? (
             <div className="font-mono" style={{color: 'var(--hazard-white)'}}>LOADING...</div>
          ) : (
            <>
              <div style={styles.avatarSection}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{...styles.avatarPlaceholder, objectFit: 'cover'}} />
                ) : (
                  <div style={styles.avatarPlaceholder}></div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />

                <button 
                  className="verge-button" 
                  style={{ background: 'var(--surface-slate)', color: 'var(--muted-text)' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "UPLOADING..." : "CHANGE PHOTO"}
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label className="font-mono" style={styles.label}>FULL NAME</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  className="verge-input" 
                  style={styles.input} 
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="font-mono" style={styles.label}>TOP SKILLS (COMMA SEPARATED)</label>
                <input 
                  type="text" 
                  value={skills} 
                  onChange={e => setSkills(e.target.value)} 
                  className="verge-input" 
                  style={styles.input} 
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="font-mono" style={styles.label}>LOOKING FOR</label>
                <input 
                  type="text" 
                  value={lookingFor} 
                  onChange={e => setLookingFor(e.target.value)} 
                  className="verge-input" 
                  style={styles.input} 
                />
              </div>

              <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  className="verge-button" 
                  style={{...styles.saveBtn, marginTop: 0}}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>
                <button 
                  className="verge-button" 
                  style={{...styles.saveBtn, marginTop: 0, background: 'var(--verge-ultraviolet)', color: 'var(--hazard-white)'}}
                  onClick={handleLogout}
                >
                  LOGOUT
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '120px 24px 64px 24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: 'clamp(60px, 8vw, 90px)',
    margin: '0 0 48px 0',
    color: 'var(--hazard-white)',
    lineHeight: 0.9,
  },
  formCard: {
    background: 'var(--canvas-black)',
    border: '1px solid var(--hazard-white)',
    borderRadius: 'var(--border-radius-card)',
    padding: '32px',
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '32px',
    gap: '16px',
  },
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'var(--jelly-mint)',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--secondary-text)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
  },
  saveBtn: {
    width: '100%',
    marginTop: '16px',
    padding: '14px',
  }
};
