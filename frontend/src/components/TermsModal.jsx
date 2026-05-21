import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield } from 'lucide-react';

export const TermsModal = ({ onAccept, userId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ terms_accepted: true })
        .eq('id', userId);

      if (updateError) throw updateError;
      onAccept();
    } catch (err) {
      console.error('Error accepting terms:', err);
      setError('Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Shield size={32} color="#009de2" />
          </div>
          <h2 style={styles.title}>Terms & Conditions</h2>
        </div>
        
        <div style={styles.content}>
          <p style={styles.paragraph}>
            Welcome to SkillShare! Before you access the platform, please review our terms of service and user conduct guidelines to ensure a safe and collaborative environment for everyone.
          </p>
          
          <h3 style={styles.subtitle}>1. User Conduct</h3>
          <p style={styles.paragraph}>
            By using SkillShare, you agree to treat all community members with respect. Harassment, hate speech, and inappropriate content are strictly prohibited and will result in account termination.
          </p>
          
          <h3 style={styles.subtitle}>2. Data & Privacy</h3>
          <p style={styles.paragraph}>
            Your profile information, skills, and portfolio are public to other users to facilitate matching. We do not sell your personal data to third parties. Private messages are end-to-end encrypted where applicable.
          </p>

          <h3 style={styles.subtitle}>3. Intellectual Property</h3>
          <p style={styles.paragraph}>
            You retain ownership of any work you showcase. However, by uploading content, you grant SkillShare a license to display it on your profile. Do not upload copyrighted material that you do not own.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <button 
            style={{...styles.button, opacity: loading ? 0.7 : 1}} 
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'I Accept'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  header: {
    padding: '30px 30px 20px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 157, 226, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  content: {
    padding: '30px',
    overflowY: 'auto',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
    lineHeight: '1.6'
  },
  subtitle: {
    color: '#fff',
    fontSize: '16px',
    marginTop: '24px',
    marginBottom: '12px'
  },
  paragraph: {
    margin: '0 0 16px 0'
  },
  footer: {
    padding: '20px 30px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  button: {
    backgroundColor: '#009de2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  error: {
    color: '#ef4444',
    padding: '0 30px',
    textAlign: 'center',
    marginBottom: '16px'
  }
};
