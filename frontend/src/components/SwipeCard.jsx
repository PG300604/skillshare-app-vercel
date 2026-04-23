import { motion, useMotionValue, useTransform } from "framer-motion";

export function SwipeCard({ user, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
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
        
        <div style={styles.skills}>
          {user.skills.map(s => (
            <span key={s} className="font-mono" style={styles.skillTag}>{s}</span>
          ))}
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
    padding: '32px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  avatar: {
    fontSize: '50px',
    marginBottom: '16px',
    width: '80px',
    height: '80px',
    background: 'var(--hazard-white)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--absolute-black)',
  },
  name: {
    fontSize: '60px',
    color: 'var(--absolute-black)',
    lineHeight: 0.9,
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: '11px',
    color: 'var(--absolute-black)',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--absolute-black)',
  },
  skills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  skillTag: {
    fontSize: '10px',
    padding: '4px 8px',
    border: '1px solid var(--absolute-black)',
    borderRadius: '100px',
    color: 'var(--absolute-black)',
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
