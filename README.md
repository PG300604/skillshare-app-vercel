# 🚀 SkillShare — Swipe. Match. Collaborate.

<div align="center">
  <img src="https://skillshare-app-vercel-xv9i.vercel.app/og-image.png?v=2" alt="SkillShare Social Preview Card" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

  [![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel%20Live-3cffd0?style=for-the-badge&logo=vercel&logoColor=000000)](https://skillshare-app-vercel-xv9i.vercel.app/)
  [![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%204.0-5200ff?style=for-the-badge&logo=springboot&logoColor=ffffff)](https://github.com/PG300604/skillshare-app-vercel)
  [![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql&logoColor=ffffff)](#tech-stack)
  [![Auth](https://img.shields.io/badge/Auth-Supabase%20JWT-hazard?style=for-the-badge&logo=supabase&logoColor=3cffd0)](#tech-stack)
</div>

---

**SkillShare** is a full-stack, geolocation-aware networking platform built for creators, designers, and developers. Think of it as a professional matchmaking app — swipe through profiles, match based on complementary skills, and collaborate on your next big idea.

---

## 🌟 Key Features

* **🤝 Tinder-Style Discover Feed** — Swipe left to pass, right to match on interactive cards powered by Framer Motion.
* **📱 Full Mobile Responsiveness** — Mobile-first UI overhaul containing compact layouts, swipe gestures, stacked header profiles, and a sticky bottom navigation bar with iOS safe-area padding.
* **🔒 LinkedIn In-App Browser Compatibility** — Intelligent user-agent detection that intercepts Google/GitHub OAuth blocks inside LinkedIn's built-in browser, showing an elegant step-by-step guidance modal to switch to Chrome/Safari.
* **📍 Geolocation Matching Engine** — Dynamic radius search using the **Haversine formula** (starts at 10km, auto-expands up to 100km) to find local creators.
* **🎯 Proficiency-Ranked Results** — Match recommendations are automatically sorted by skill expertise (Advanced → Intermediate → Beginner).
* **💬 Real-Time Messaging** — Instant chat with matched users featuring media uploads, polls, event scheduling, and emoji stickers.
* **✨ Open Graph / SEO Link Previews** — Configured meta tags with absolute production asset URLs and cache-busting versioning, rendering high-fidelity app previews on LinkedIn and social networks.

---

## 🛠️ Tech Stack

| Layer | Technology | Key Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind/CSS | Fast compilation, modern interactive styling, routing |
| **Animation** | Framer Motion, Three.js / fiber | Smooth cards swipe motion, webGL elements |
| **Backend** | Java 17, Spring Boot 4.0 | Robust security, rest API routing, matching algorithms |
| **Security** | Spring Security, JWT Resource Server | Secure API requests matching Supabase OAuth tokens |
| **Auth & Chat** | Supabase JS SDK, Realtime | OAuth2 authentication provider, instant websocket chats |
| **Database** | PostgreSQL, JPA / Hibernate | Persistent profiles, matches, and tags relationships |
| **Hosting** | Vercel (Frontend), Docker (Backend) | Immutable edge deployments, lightweight backend image |

---

## 🌐 Architecture

```
┌───────────────────────────────────────────────┐
│                React Frontend                 │
│    (Vite · React Router v7 · Framer Motion)   │
│                                               │
│    LandingPage  ──►  SetupProfile  ──► Home   │
│    Explore (Swipe) ──► Matches ──► Messages   │
└───────────────────────┬───────────────────────┘
                        │
                        │ REST API calls (Bearer JWT Token)
                        ▼
┌───────────────────────────────────────────────┐
│             Spring Boot Backend               │
│                                               │
│    SecurityConfig (OAuth2 Supabase Decoder)   │
│           │                                   │
│    MatchController  ──►  MatchService         │
│           │                   │               │
│    UserRepository       Haversine Algorithm   │
│    (PostgreSQL/H2)      Dynamic Radius Search │
└───────────────────────┬───────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    PostgreSQL (Production)   Supabase (Realtime + Auth)
```

---

## 🧠 The Match Engine

The core matching algorithm is handled in Java on the backend inside `MatchService.java`:

1. **Shared Skills Query**: Fetches potential candidates sharing at least one skill.
2. **Haversine Distance calculation**: Checks physical distance in kilometers using coordinate geometry:
   ```java
   private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
       final int R = 6371; // Earth radius in km
       double latDistance = Math.toRadians(lat2 - lat1);
       double lonDistance = Math.toRadians(lon2 - lon1);
       double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
               + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
               * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
       return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   }
   ```
3. **Dynamic Radius Expansion**: Filters candidates within **10km**. If fewer than 3 matches exist, recursively expands the search radius by 10km up to a **100km limit**.
4. **Ranked Sorting**: Sorts profiles based on skill proficiency levels (Advanced=3, Intermediate=2, Beginner=1).
5. **Global Fallback**: If no nearby users are found, displays top global featured profiles.

---

## 📂 Project Structure

```
skillshare-app-vercel/
├── src/main/java/com/example/skillshare/
│   ├── config/SecurityConfig.java     # CORS policies & Supabase token validation
│   ├── controller/MatchController.java# Discovery endpoint provider
│   ├── model/User.java                # JPA Entity for User Profile
│   ├── service/MatchService.java      # Haversine distance matchmaking algorithm
│   └── SkillshareApplication.java     # Entrypoint
├── frontend/
│   ├── public/                        # Static assets (favicons, og-image.png)
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx        # Login, In-App browser block alert, step modal
│   │   │   ├── Navbar.jsx             # Top bar + mobile bottom bar (iOS safe areas)
│   │   │   └── SwipeCard.jsx          # Drag-to-match profile card
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Feed timeline (responsive flex layout)
│   │   │   ├── Messages.jsx           # Sidebar/chat details responsive panels
│   │   │   └── UserProfile.jsx        # Stacked mobile responsive detail sheet
│   │   └── supabaseClient.js          # DB config initialization
│   ├── index.html                     # SEO Meta, OG / Twitter tags, cache buster
│   ├── vercel.json                    # Single Page App routing overrides
│   └── vite.config.js
├── Dockerfile                         # Build package Maven runner
└── pom.xml
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+** & **Maven 3.9+**
- **Node.js 18+**
- A **Supabase** Project (for database credentials & realtime sockets)

### 💻 Local Run

#### 1. Start the Backend (H2 Database Seeded)
```bash
# Clone the repository
git clone https://github.com/PG300604/skillshare-app-vercel.git
cd skillshare-app-vercel

# Start the Spring Boot server (uses H2 DB automatically)
./mvnw spring-boot:run
# Backend will spin up at http://localhost:8080
```

#### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend dev server will start at http://localhost:5173
```

Configure a `/frontend/.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_THEME=warm-sunset
```

---

## 📈 Roadmap

- [ ] **Dynamic WebSockets** for live push matches notifications.
- [ ] **PostgreSQL Full-Text index** search for skill query optimization.
- [ ] **Collaborator Reviews** and skill endorsements between matched users.
- [ ] **Calendar Booker Integration** to schedule video meetings inside chats.
- [ ] **Cross-Platform Native Client** built on React Native.

---

## ✒️ Author

**Priyanshu Ghosh** — B.Tech CSBS @ Asansol Engineering College
* [LinkedIn](https://www.linkedin.com/in/priyanshughosh-)
* [GitHub](https://github.com/PG300604)
