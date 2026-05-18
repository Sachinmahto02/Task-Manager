# ✦ Task Manager — Smart Daily Journal

## 🚀 How to Run

### Prerequisites
- Node.js v18+  →  https://nodejs.org
- MongoDB running locally OR free Atlas  →  https://mongodb.com/atlas

### Step 1 — Open in VS Code
```bash
unzip zenflow-v7-final.zip
code zenflow-v7
```

### Step 2 — Configure .env
Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zenflow
JWT_SECRET=change_this_to_something_long
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id (optional)
EMAIL_USER=your_gmail@gmail.com (optional)
EMAIL_PASS=your_app_password (optional)
CLIENT_URL=http://localhost:3000
```

### Step 3 — Install & start backend
```bash
# Terminal 1
cd backend
npm install
npm run dev
# ✅ MongoDB Connected  🚀 Server on http://localhost:5000
```

### Step 4 — Install & start frontend
```bash
# Terminal 2  (Ctrl+Shift+` in VS Code)
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## 🏗 Project Structure
```
zenflow-v7/
├── backend/
│   ├── .env
│   ├── server.js
│   ├── models/  User.js  Task.js  Reflection.js  Feedback.js
│   ├── routes/  auth.js  tasks.js  reflections.js  analytics.js  feedback.js
│   ├── middleware/auth.js
│   └── utils/sendEmail.js
└── frontend/src/
    ├── App.js
    ├── context/AuthContext.js
    └── components/
        ├── auth/        Login  Register  ForgotPassword  ResetPassword
        ├── dashboard/   Dashboard.js/.css
        ├── tasks/       Tasks.js/.css  (⭐ star rating)
        ├── analytics/   Analytics.js/.css  (💬 feedback card)
        ├── reflection/  Reflection.js/.css
        ├── profile/     EditProfile.js/.css  (🖼 avatar upload)
        └── layout/      Sidebar.js/.css  (📅 history)  CustomCursor.js
```
