import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Mail } from "lucide-react";

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);


export function LandingPage() {
  const [session, setSession] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    let error;
    if (isSignUp) {
      const res = await supabase.auth.signUp({ email, password });
      error = res.error;
      if (!error && !res.data.session) {
        setAuthSuccess("Success! Please check your email for the confirmation link.");
      }
    } else {
      const res = await supabase.auth.signInWithPassword({ email, password });
      error = res.error;
    }
    if (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    document.title = "SkillShare | Welcome to the Hub";
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* Left Column: Copy & Auth */}
        <div style={styles.leftCol}>
          <div className="font-display" style={styles.eyebrow}>SKILLSHARE</div>
          <h1 className="font-display" style={styles.headline}>
            COLLABORATE.<br />
            GROW.<br />
            VIBE.
          </h1>
          <p style={styles.subtext}>
            Build your network, one skill at a time. The professional dating app for creators.
          </p>
          
          <div style={styles.authBox}>
            {!session ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    style={styles.input} 
                    required 
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    style={styles.input} 
                    required 
                  />
                  {authError && <div style={{color: 'var(--red-error)', fontSize: '14px'}}>{authError}</div>}
                  {authSuccess && <div style={{color: 'var(--jelly-mint)', fontSize: '14px'}}>{authSuccess}</div>}
                  <button type="submit" disabled={authLoading} className="verge-button" style={{ width: "100%", background: "var(--jelly-mint)", color: "var(--absolute-black)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Mail size={18} />
                    {authLoading ? "Loading..." : isSignUp ? "Sign Up with Email" : "Log In with Email"}
                  </button>
                  <div 
                    style={{ textAlign: "center", color: "var(--hazard-white)", fontSize: "14px", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
                  </div>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--hazard-white)", opacity: 0.2 }} />
                  <div style={{ color: "var(--hazard-white)", opacity: 0.5, fontSize: "12px" }}>OR</div>
                  <div style={{ flex: 1, height: "1px", background: "var(--hazard-white)", opacity: 0.2 }} />
                </div>

                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
                  className="verge-button"
                  style={{ width: "100%", background: "#ffffff", color: "#000000", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <Mail size={18} />
                  Continue with Google
                </button>
                
                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } })}
                  className="verge-button"
                  style={{ width: "100%", background: "#333", color: "var(--hazard-white)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <GithubIcon />
                  Continue with GitHub
                </button>


              </div>
            ) : (
              <div style={{color: 'var(--hazard-white)', textAlign: 'center'}}>You are already logged in!</div>
            )}
          </div>
        </div>

        {/* Right Column: Feature Block (App Mockup) */}
        <div style={styles.rightCol}>
          <div style={styles.mockupContainer}>
             {/* Browser Header */}
             <div style={styles.mockupHeader}>
                <div style={{display: 'flex', gap: '6px'}}>
                  <div style={styles.mockupDot} />
                  <div style={styles.mockupDot} />
                  <div style={styles.mockupDot} />
                </div>
                <div className="font-mono" style={{color: 'var(--hazard-white)', opacity: 0.5, fontSize: '10px'}}>skillshare.app/network</div>
             </div>
             
             {/* App Content Mockup */}
             <div style={styles.mockupBody}>
                <div style={{display: 'flex', gap: '24px', height: '100%'}}>
                   {/* Messages Pane Mockup */}
                   <div style={{flex: '0 0 160px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      <div style={{width: '60%', height: '12px', background: 'var(--hazard-white)', marginBottom: '8px'}} />
                      
                      <div style={{padding: '12px', border: '1px solid var(--absolute-black)', borderRadius: '8px', background: 'var(--jelly-mint)'}}>
                         <div style={{width: '70%', height: '8px', background: 'var(--absolute-black)', marginBottom: '8px'}} />
                         <div style={{width: '90%', height: '6px', background: 'var(--absolute-black)', opacity: 0.7}} />
                      </div>

                      <div style={{padding: '12px', border: '1px solid var(--hazard-white)', borderRadius: '8px'}}>
                         <div style={{width: '60%', height: '8px', background: 'var(--hazard-white)', marginBottom: '8px'}} />
                         <div style={{width: '80%', height: '6px', background: 'var(--hazard-white)', opacity: 0.5}} />
                      </div>

                      <div style={{padding: '12px', border: '1px solid var(--hazard-white)', borderRadius: '8px'}}>
                         <div style={{width: '75%', height: '8px', background: 'var(--hazard-white)', marginBottom: '8px'}} />
                         <div style={{width: '85%', height: '6px', background: 'var(--hazard-white)', opacity: 0.5}} />
                      </div>
                   </div>

                   {/* Swipe Card Mockup */}
                   <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <div style={{width: '200px', height: '280px', background: 'var(--verge-ultraviolet)', borderRadius: '16px', border: '1px solid var(--hazard-white)', padding: '20px', display: 'flex', flexDirection: 'column'}}>
                         <div style={{width: '48px', height: '48px', borderRadius: '50%', background: 'var(--hazard-white)', marginBottom: '16px'}} />
                         <div style={{width: '70%', height: '12px', background: 'var(--hazard-white)', marginBottom: '8px'}} />
                         <div style={{width: '40%', height: '8px', background: 'var(--hazard-white)', opacity: 0.7, marginBottom: '24px'}} />
                         
                         <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                            <div style={{width: '40px', height: '12px', borderRadius: '10px', border: '1px solid var(--hazard-white)'}} />
                            <div style={{width: '50px', height: '12px', borderRadius: '10px', border: '1px solid var(--hazard-white)'}} />
                         </div>

                         <div style={{marginTop: 'auto', alignSelf: 'flex-start', background: 'var(--hazard-white)', color: 'var(--absolute-black)', padding: '8px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px'}}>
                            99% MATCH
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--canvas-black)",
    overflowY: "auto",
    overflowX: "hidden",
  },
  container: {
    width: "100%",
    maxWidth: "1280px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 48px",
    flexWrap: "wrap",
  },
  leftCol: {
    flex: "1 1 50%",
    minWidth: "300px",
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    zIndex: 2,
    marginBottom: "40px",
  },
  rightCol: {
    flex: "1 1 50%",
    minWidth: "300px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 1, 
  },
  eyebrow: {
    fontSize: "36px",
    color: "var(--jelly-mint)",
    marginBottom: "-16px",
  },
  headline: {
    fontSize: "clamp(60px, 8vw, 107px)",
    color: "var(--hazard-white)",
    margin: 0,
  },
  subtext: {
    fontSize: "16px",
    color: "var(--secondary-text)",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: "400px",
  },
  authBox: {
    marginTop: "16px",
    width: "100%",
    maxWidth: "400px",
  },
  mockupContainer: {
    width: "100%",
    maxWidth: "520px",
    background: "var(--canvas-black)",
    border: "1px solid var(--hazard-white)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
  },
  mockupHeader: {
    height: "36px",
    borderBottom: "1px solid var(--hazard-white)",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: "16px",
    background: "var(--surface-slate)",
  },
  mockupDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "var(--hazard-white)",
    opacity: 0.3,
  },
  mockupBody: {
    height: "380px",
    background: "var(--canvas-black)",
    padding: "24px",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "var(--hazard-white)",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
  }
};
