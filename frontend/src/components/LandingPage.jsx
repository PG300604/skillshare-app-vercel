import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function LandingPage() {
  const [session, setSession] = useState(null);

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
                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
                  className="verge-button"
                  style={{ width: "100%" }}
                >
                  Continue with Google
                </button>
                
                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc', options: { redirectTo: window.location.origin } })}
                  className="verge-button"
                  style={{ width: "100%", background: "var(--verge-ultraviolet)", color: "var(--hazard-white)" }}
                >
                  Continue with LinkedIn
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
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--canvas-black)",
    overflow: "hidden",
  },
  container: {
    width: "100%",
    maxWidth: "1280px",
    height: "100%",
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
  }
};
