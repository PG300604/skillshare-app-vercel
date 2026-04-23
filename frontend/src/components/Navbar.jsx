import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

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

  return (
    <nav style={styles.navContainer}>
      <div style={styles.navBar}>
        <div className="font-display" style={styles.wordmark}>SKILLSHARE</div>
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
  },
  wordmark: {
    fontSize: '32px',
    color: 'var(--hazard-white)',
    lineHeight: 1,
  },
  linksContainer: {
    display: 'flex',
    gap: '24px',
  },
  subscribeBtn: {
    padding: '8px 16px',
    fontSize: '11px',
    borderRadius: 'var(--border-radius-pill-lg)'
  }
};
