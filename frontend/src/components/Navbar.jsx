import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navItems = [
    { 
      path: '/home', 
      label: 'Home',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    { 
      path: '/explore', 
      label: 'Explore',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      )
    },
    { 
      path: '/matches', 
      label: 'Matches',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      )
    },
    { 
      path: '/messages', 
      label: 'Messages',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    { 
      path: '/profile', 
      label: 'Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ];

  const handleShare = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SkillShare',
          text: 'Join me on SkillShare to collaborate and grow!',
          url: url,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(5);
        
      if (!error && data) {
        setSearchResults(data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <>
      <nav className="top-navbar-container" style={styles.navContainer}>
        <div className="top-navbar" style={styles.navBar}>
          <div className="font-display top-logo" style={styles.wordmark}>SKILLSHARE</div>
          
          <div className="desktop-only desktop-search" style={styles.searchContainer}>
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              className="font-sans"
            />
            {searchQuery && (
              <div style={styles.searchResults}>
                 {isSearching ? (
                   <div style={styles.searchItem}>Searching...</div>
                 ) : searchResults.length > 0 ? (
                   searchResults.map(user => (
                     <div 
                       key={user.id} 
                       style={styles.searchItem}
                       onClick={() => {
                         navigate(`/user/${user.id}`);
                         setSearchQuery('');
                       }}
                     >
                       <div style={{fontWeight: 'bold', color: 'var(--hazard-white)'}}>{user.full_name || user.name || 'User'}</div>
                       <div style={{fontSize: '12px', color: 'var(--secondary-text)'}}>@{user.username || 'unknown'}</div>
                     </div>
                   ))
                 ) : (
                   <div style={styles.searchItem}>No users found.</div>
                 )}
              </div>
            )}
          </div>

          <div className="desktop-only desktop-links" style={styles.linksContainer}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`verge-nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button className="verge-button" style={styles.subscribeBtn} onClick={handleShare}>SHARE</button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-only mobile-bottom-nav" style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                ...styles.bottomNavLink,
                color: isActive ? 'var(--jelly-mint)' : 'var(--secondary-text)'
              }}
            >
              {item.icon}
              <span className="font-mono" style={{
                ...styles.bottomNavLabel,
                color: isActive ? 'var(--jelly-mint)' : 'var(--secondary-text)'
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <style>{`
        .mobile-only {
          display: none !important;
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
          .top-navbar-container {
            height: 60px !important;
          }
          .top-navbar {
            height: 60px !important;
            padding: 0 16px !important;
            gap: 12px !important;
          }
          .top-logo {
            font-size: 24px !important;
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  navContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 1000,
    background: 'var(--canvas-black)',
    borderBottom: '1px solid var(--image-frame)',
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '64px',
    maxWidth: '1280px',
    margin: '0 auto',
    gap: '24px'
  },
  wordmark: {
    fontSize: '32px',
    color: 'var(--hazard-white)',
    lineHeight: 1,
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '300px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 16px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'var(--hazard-white)',
    outline: 'none',
  },
  searchResults: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    width: '100%',
    background: 'var(--surface-slate)',
    border: '1px solid var(--image-frame)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  searchItem: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
  },
  linksContainer: {
    display: 'flex',
    gap: '24px',
    flex: 2,
    justifyContent: 'flex-end',
    marginRight: '24px'
  },
  subscribeBtn: {
    padding: '8px 16px',
    fontSize: '11px',
    borderRadius: 'var(--border-radius-pill-lg)'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '60px',
    background: 'var(--canvas-black)',
    borderTop: '1px solid var(--image-frame)',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000,
    padding: '0 8px',
  },
  bottomNavLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    gap: '4px',
    flex: 1,
    height: '100%',
    transition: 'var(--transition-smooth)',
  },
  bottomNavLabel: {
    fontSize: '8px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  }
};
