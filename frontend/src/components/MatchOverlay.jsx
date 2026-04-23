import { motion } from "framer-motion";

export function MatchOverlay({ user, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--verge-ultraviolet)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        pointerEvents: "auto",
        padding: "24px",
      }}
      onClick={onClose}
    >
       <motion.div
         initial={{ scale: 0.95, y: 10 }}
         animate={{ scale: 1, y: 0 }}
         transition={{ duration: 0.2, ease: "easeOut" }}
         style={{ textAlign: "center", color: "var(--hazard-white)" }}
       >
          <div style={{
            fontSize: "80px",
            marginBottom: "24px",
            background: "var(--hazard-white)",
            borderRadius: "50%",
            width: "120px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
          }}>
            {user?.avatar ?? "👤"}
          </div>
          <div className="font-display" style={{
            fontSize: "clamp(80px, 12vw, 160px)",
            lineHeight: 0.9,
            marginBottom: "16px"
          }}>
            MATCHED
          </div>
          <div className="font-mono" style={{ fontSize: "14px" }}>
            YOU AND {user?.name?.toUpperCase()} WANT TO COLLABORATE
          </div>
       </motion.div>
    </motion.div>
  );
}
