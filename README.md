# SkillShare — Find Your Collaborator

> A Tinder-style full-stack platform that connects people based on shared skills — swipe, match, and build together.

---

## What It Does

SkillShare lets users discover nearby collaborators who share their skills. Set up your profile with the skills you know (and your proficiency level), and the platform surfaces the best matches around you — ranked by skill level, filtered by distance, with a swipe UI to connect.

Think of it as a dating app, but instead of romance, you're finding your next project partner, study buddy, or mentor.

---

## Features

- **Swipe-based discovery** — Tinder-style card UI to explore potential collaborators
- **Geolocation matching** — Dynamic radius search using the Haversine formula (starts at 10km, auto-expands to 100km if needed)
- **Proficiency-ranked results** — Matches sorted by skill level (Advanced → Intermediate → Beginner)
- **Global fallback** — If no local matches exist, surfaces top global profiles by skill score
- **Supabase Auth** — OAuth2 JWT-secured backend, email/social login on frontend
- **Real-time messaging** — Chat with your matches directly in the app
- **Profile setup flow** — Onboarding that gates the app until profile is complete
- **Activity timeline** — Home feed showing your recent matches and activity
- **Dockerized backend** — Multi-stage Docker build for clean, lightweight deployment
- **Deployed on Vercel** — Frontend live at [skillshare-app-vercel.vercel.app](https://skillshare-app-vercel-xv9i.vercel.app/)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 4.0 |
| Security | Spring Security, OAuth2 Resource Server, Supabase JWT |
| ORM | Spring Data JPA, Hibernate, Lombok |
| Database | PostgreSQL (production), H2 (local dev) |
| Build | Maven, multi-stage Dockerfile |
| Frontend | React 19, Vite, React Router v7 |
| UI/Animation | Framer Motion, React Three Fiber / Three.js |
| Auth Client | Supabase JS SDK, Supabase Auth UI |
| Deployment | Vercel (frontend), Docker (backend) |

---

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend             │
│   (Vite · React Router · Framer Motion) │
│                                         │
│  LandingPage → SetupProfile → Home      │
│  Explore (Swipe) → Matches → Messages   │
└──────────────────┬──────────────────────┘
                   │ REST API calls
                   │ Bearer JWT (Supabase)
┌──────────────────▼──────────────────────┐
│           Spring Boot Backend           │
│                                         │
│  SecurityConfig (OAuth2 JWT Decoder)    │
│         │                               │
│  MatchController  →  MatchService       │
│         │               │               │
│  UserRepository    Haversine Algorithm  │
│         │          Dynamic Radius Search │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   PostgreSQL (prod) │
        │   H2 (local dev)    │
        └─────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Supabase          │
        │   (Auth + Realtime) │
        └─────────────────────┘
```

---

## The Matching Algorithm

The core of the backend is a geolocation-aware skill matching engine in `MatchService.java`.

**How it works:**

1. Fetches all users who share at least one skill with the current user (via JPA query)
2. Starts with a **10km radius** and filters candidates within that range using the **Haversine formula**
3. If fewer than 3 matches are found, the radius **auto-expands by 10km** recursively, up to a **100km cap**
4. Results are **ranked by proficiency score** (Advanced=3, Intermediate=2, Beginner=1)
5. If zero matches exist within 100km, the algorithm falls back to **global featured profiles** sorted by proficiency
6. Last resort: returns 5 random users so the app never shows an empty state

```java
// Haversine formula — calculates real-world distance between two GPS coordinates
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

---

## Project Structure

```
skillshare-app/
├── src/main/java/com/example/skillshare/
│   ├── config/
│   │   └── SecurityConfig.java       # CORS, OAuth2 JWT, Spring Security setup
│   ├── controller/
│   │   └── MatchController.java      # GET /api/matches/discover
│   ├── model/
│   │   ├── User.java                 # Profile entity (JPA)
│   │   └── UserSkill.java            # Skill entity with proficiency scoring
│   ├── repository/
│   │   └── UserRepository.java       # JPA queries for shared-skill lookup
│   ├── service/
│   │   └── MatchService.java         # Haversine + dynamic radius algorithm
│   └── SkillshareApplication.java
├── src/main/resources/
│   ├── application.yml               # DB config, OAuth2 JWK URI
│   └── data.sql                      # Seed data for local dev
├── frontend/
│   ├── src/
│   │   ├── pages/                    # Home, Explore, Matches, Messages, Profile
│   │   ├── components/               # SwipeCard, Navbar, MatchOverlay, LandingPage
│   │   └── supabaseClient.js         # Supabase init
│   ├── package.json
│   └── vite.config.js
├── Dockerfile                        # Multi-stage Maven + JRE build
└── pom.xml
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- A [Supabase](https://supabase.com) project (for auth + realtime)
- PostgreSQL (optional for local — H2 is used by default)

### Backend

```bash
# Clone the repo
git clone https://github.com/PG300604/skillshare-app-vercel.git
cd skillshare-app-vercel

# Run with H2 (no DB setup needed)
./mvnw spring-boot:run

# Backend runs at http://localhost:8080
# H2 Console at http://localhost:8080/h2-console
```

**Environment variables (for PostgreSQL/production):**

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>/<db>
SPRING_DATASOURCE_USERNAME=your_user
SPRING_DATASOURCE_PASSWORD=your_password
```

### Frontend

```bash
cd frontend
npm install
npm run dev

# Frontend runs at http://localhost:5173
```

**Required `.env` in `/frontend`:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8080
```

### Docker (Backend)

```bash
# Build the image
docker build -t skillshare-backend .

# Run with PostgreSQL
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host/db \
  -e SPRING_DATASOURCE_USERNAME=user \
  -e SPRING_DATASOURCE_PASSWORD=pass \
  skillshare-backend
```

---

## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/matches/discover` | JWT required | Returns ranked collaborator list for the current user |

**Query params:** `lat` (double), `lng` (double) — optional, overrides stored coordinates.

**Response:** Array of `User` objects with skills, tags, and location data.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) — auto-deployed from `/frontend` |
| Backend | Docker container (any container host) |
| Auth + Realtime | [Supabase](https://supabase.com) |

The frontend `vercel.json` handles client-side routing rewrites so React Router works correctly on Vercel.

---

## Roadmap

- [ ] Add WebSocket support for live match notifications
- [ ] Migrate to PostgreSQL full-text search for skill queries
- [ ] Add skill endorsements between matched users
- [ ] Session scheduling (book a collab session with a match)
- [ ] Mobile app (React Native)

---

## Author

**Priyanshu Ghosh** — B.Tech CSBS @ Asansol Engineering College  
[LinkedIn](https://www.linkedin.com/in/priyanshughosh-) · [GitHub](https://github.com/PG300604)
