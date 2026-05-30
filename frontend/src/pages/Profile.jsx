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
  const [projects, setProjects] = useState([]);
  const [experiences, setExperiences] = useState([]);

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
        setFullName(data.name || data.full_name || "");
        setSkills(data.skills ? data.skills.join(", ") : "");
        setLookingFor(data.looking_for || "");
        setAvatarUrl(data.avatar_url || "");
        setProjects(data.projects || []);
        setExperiences(data.experiences || []);
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

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (data) {
        setAvatarUrl(data.publicUrl);
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
      full_name: fullName,
      skills: skillsArray,
      looking_for: lookingFor,
      avatar_url: avatarUrl,
      projects: projects,
      experiences: experiences,
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

  const handleDeleteProfile = async () => {
    const confirm = window.confirm("Are you sure you want to delete your profile? This cannot be undone.");
    if (!confirm) return;

    try {
      // Soft delete: remove from profiles table and sign out.
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      alert("Error deleting profile.");
    }
  };

  // Helper for arrays
  const addProject = () => setProjects([...projects, { title: '', description: '', url: '' }]);
  const updateProject = (i, field, val) => {
    const p = [...projects];
    p[i][field] = val;
    setProjects(p);
  };
  const removeProject = (i) => setProjects(projects.filter((_, idx) => idx !== i));

  const addExperience = () => setExperiences([...experiences, { role: '', company: '', duration: '' }]);
  const updateExperience = (i, field, val) => {
    const e = [...experiences];
    e[i][field] = val;
    setExperiences(e);
  };
  const removeExperience = (i) => setExperiences(experiences.filter((_, idx) => idx !== i));

  return (
    <div className="profile-container" style={styles.container}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={styles.content}>
        <h1 className="font-display profile-title" style={styles.title}>YOUR PROFILE</h1>
        
        <div className="profile-form-card" style={styles.formCard}>
          {loading ? (
             <div className="font-mono" style={{color: 'var(--hazard-white)'}}>LOADING...</div>
          ) : (
            <>
              <div className="profile-avatar-section" style={styles.avatarSection}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{...styles.avatarPlaceholder, objectFit: 'cover'}} />
                ) : (
                  <div style={styles.avatarPlaceholder}></div>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                <button className="verge-button" style={{ background: 'var(--surface-slate)', color: 'var(--muted-text)' }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? "UPLOADING..." : "CHANGE PHOTO"}
                </button>
              </div>

              <div style={styles.inputGroup}>
                <label className="font-mono" style={styles.label}>FULL NAME</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="verge-input" style={styles.input} />
              </div>

              <div style={styles.inputGroup}>
                <label className="font-mono" style={styles.label}>TOP SKILLS (COMMA SEPARATED)</label>
                <input type="text" value={skills} onChange={e => setSkills(e.target.value)} className="verge-input" style={styles.input} />
              </div>

              <div style={styles.inputGroup}>
                <label className="font-mono" style={styles.label}>LOOKING FOR (e.g. Co-founder, Designer)</label>
                <input type="text" value={lookingFor} onChange={e => setLookingFor(e.target.value)} className="verge-input" style={styles.input} />
              </div>

              <div style={styles.divider} />

              {/* EXPERIENCES */}
              <div style={styles.inputGroup}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <label className="font-mono" style={styles.label}>EXPERIENCE</label>
                  <button className="font-mono" style={styles.textBtn} onClick={addExperience}>+ ADD</button>
                </div>
                {experiences.map((exp, i) => (
                  <div key={i} style={styles.arrayItem}>
                    <input type="text" placeholder="Role (e.g. Senior Developer)" value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} className="verge-input" style={styles.input} />
                    <input type="text" placeholder="Company" value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} className="verge-input" style={styles.input} />
                    <input type="text" placeholder="Duration (e.g. 2020 - Present)" value={exp.duration} onChange={e => updateExperience(i, 'duration', e.target.value)} className="verge-input" style={styles.input} />
                    <button className="font-mono" style={{...styles.textBtn, color: 'var(--red-error)'}} onClick={() => removeExperience(i)}>REMOVE</button>
                  </div>
                ))}
              </div>

              <div style={styles.divider} />

              {/* PROJECTS */}
              <div style={styles.inputGroup}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <label className="font-mono" style={styles.label}>PROJECTS</label>
                  <button className="font-mono" style={styles.textBtn} onClick={addProject}>+ ADD</button>
                </div>
                {projects.map((proj, i) => (
                  <div key={i} style={styles.arrayItem}>
                    <input type="text" placeholder="Project Name" value={proj.title} onChange={e => updateProject(i, 'title', e.target.value)} className="verge-input" style={styles.input} />
                    <input type="text" placeholder="Description" value={proj.description} onChange={e => updateProject(i, 'description', e.target.value)} className="verge-input" style={styles.input} />
                    <input type="text" placeholder="Link URL" value={proj.url} onChange={e => updateProject(i, 'url', e.target.value)} className="verge-input" style={styles.input} />
                    <button className="font-mono" style={{...styles.textBtn, color: 'var(--red-error)'}} onClick={() => removeProject(i)}>REMOVE</button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button className="verge-button" style={{...styles.saveBtn, marginTop: 0}} onClick={handleSave} disabled={saving}>
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>
                <button className="verge-button" style={{...styles.saveBtn, marginTop: 0, background: 'var(--verge-ultraviolet)', color: 'var(--hazard-white)'}} onClick={handleLogout}>
                  LOGOUT
                </button>
                <button className="font-mono" style={{...styles.textBtn, color: 'var(--red-error)', alignSelf: 'center', marginTop: '16px'}} onClick={handleDeleteProfile}>
                  DELETE PROFILE
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .profile-container {
            padding: 88px 12px 100px 12px !important;
          }
          .profile-title {
            font-size: clamp(36px, 10vw, 56px) !important;
            margin-bottom: 24px !important;
          }
          .profile-form-card {
            padding: 16px !important;
          }
          .profile-avatar-section {
            align-items: center !important;
            width: 100% !important;
          }
        }
      `}</style>
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
  content: {
    maxWidth: '800px',
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
  },
  textBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--jelly-mint)',
    cursor: 'pointer',
    fontSize: '12px'
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    margin: '32px 0'
  },
  arrayItem: {
    background: 'rgba(255,255,255,0.02)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px'
  }
};
