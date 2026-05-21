import { motion, useMotionValue, useTransform } from "framer-motion";

export function SwipeCard({ user, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    if (!info || !info.offset) return;
    const offsetX = info.offset.x;
    if (offsetX > 100) {
      onSwipe("left");
    } else if (offsetX < -100) {
      onSwipe("right");
    }
  };

  return (
    <motion.div
      style={{
        ...styles.card,
        x,
        rotate,
        opacity,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "tween", duration: 0.15 }}
    >
      <div style={styles.content}>
        <div style={styles.avatar}>{user.avatar}</div>
        <h2 className="font-display" style={styles.name}>{user.name}</h2>
        <div className="font-mono" style={styles.meta}>{user.role} // {user.location}</div>
        
        <div style={styles.detailsContainer}>
          {user.skills && user.skills.length > 0 && (
            <div style={styles.section}>
              <div className="font-mono" style={styles.sectionLabel}>SKILLS</div>
              <div style={styles.tagGroup}>
                {user.skills.map(s => (
                  <span key={s} className="font-mono" style={styles.skillTag}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {user.tags && user.tags.length > 0 && (
            <div style={styles.section}>
              <div className="font-mono" style={styles.sectionLabel}>VIBE</div>
              <div style={styles.tagGroup}>
                {user.tags.map(t => (
                  <span key={t} className="font-mono" style={styles.vibeTag}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.matchBadge}>
          <div style={styles.matchCircle}>{user.match}%</div>
          <div className="font-mono" style={styles.matchText}>MATCH</div>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'var(--jelly-mint)',
    borderRadius: 'var(--border-radius-feature)',
    border: '1px solid var(--absolute-black)',
    cursor: 'grab',
    overflow: 'hidden',
  },
  content: {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  avatar: {
    fontSize: '40px',
    marginBottom: '12px',
    width: '64px',
    height: '64px',
    background: 'var(--hazard-white)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--absolute-black)',
  },
  name: {
    fontSize: 'clamp(28px, 6.5vw, 42px)',
    color: 'var(--absolute-black)',
    lineHeight: 1.0,
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
  },
  meta: {
    fontSize: '11px',
    color: 'var(--absolute-black)',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--absolute-black)',
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionLabel: {
    fontSize: '9px',
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  skillTag: {
    fontSize: '9px',
    padding: '3px 8px',
    border: '1px solid var(--absolute-black)',
    borderRadius: '4px',
    color: 'var(--absolute-black)',
    fontWeight: '600',
  },
  vibeTag: {
    fontSize: '9px',
    padding: '3px 8px',
    background: 'var(--absolute-black)',
    borderRadius: '4px',
    color: 'var(--jelly-mint)',
    fontWeight: '600',
  },
  matchBadge: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--absolute-black)',
    color: 'var(--jelly-mint)',
    padding: '12px',
    borderRadius: '8px',
  },
  matchCircle: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  matchText: {
    fontSize: '10px',
  }
};
