import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function Navbar() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navItems = [
    { path: '/home', label: 'Home' },
    { path: '/explore', label: 'Explore' },
    { path: '/matches', label: 'Matches' },
    { path: '/messages', label: 'Messages' },
    { path: '/profile', label: 'Profile' }
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
    <nav style={styles.navContainer}>
      <div style={styles.navBar}>
        <div className="font-display" style={styles.wordmark}>SKILLSHARE</div>
        
        <div style={styles.searchContainer}>
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
                       alert(`Viewing ${user.full_name}'s profile is coming soon!`);
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

        <div style={styles.linksContainer}>
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
  }
};
