# PipelineX — AI-Powered DevOps Manager

## 🚀 Setup & Run

### 1. Install dependencies
```bash
cd pipelinex
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Open in browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
pipelinex/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx       ← Home page
│   │   ├── Login.jsx         ← Login page
│   │   ├── Register.jsx      ← Register page
│   │   ├── Dashboard.jsx     ← Main dashboard
│   │   ├── NewPipeline.jsx   ← Create pipeline (Day 2)
│   │   ├── PipelineDetail.jsx← Live logs (Day 2)
│   │   ├── Monitor.jsx       ← Charts (Day 3)
│   │   ├── AIChat.jsx        ← AI assistant (Day 3)
│   │   └── Settings.jsx      ← Settings (Day 3)
│   ├── components/
│   │   ├── Sidebar.jsx       ← Navigation sidebar
│   │   └── Layout.jsx        ← Page layout wrapper
│   ├── context/
│   │   └── AuthContext.jsx   ← Login state management
│   ├── App.jsx               ← Routes
│   ├── main.jsx              ← Entry point
│   └── index.css             ← Global styles
├── .env                      ← API URL config
├── index.html
├── vite.config.js
└── package.json
```

---

## 📅 Build Plan

| Day | Status | Pages |
|-----|--------|-------|
| Day 1 | ✅ Done | Landing, Login, Register, Dashboard |
| Day 2 | 🔜 Next | NewPipeline, PipelineDetail, AI Integration |
| Day 3 | 🔜 | Monitor, AIChat, Settings |
| Day 4 | 🔜 | Backend (FastAPI) |
| Day 5 | 🔜 | OpenAI Integration |
| Day 6 | 🔜 | Connect Frontend + Backend |
| Day 7 | 🔜 | Deploy to Vercel + Railway |

---

## 🛠️ Tech Stack

- **Frontend:** React.js + Vite
- **Routing:** React Router DOM
- **Charts:** Recharts
- **HTTP:** Axios
- **Backend (Day 4):** Python FastAPI
- **AI (Day 5):** OpenAI GPT-4
- **Deploy:** Vercel + Railway
