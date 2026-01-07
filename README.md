# Study Planner - Smart Exam-Aware Task Scheduler

## 📊 System Architecture

```mermaid
graph TB
    subgraph Frontend["🖥️ FRONTEND - React"]
        UI["Dashboard, DailyPlan, WeeklyPlan, ExamManager, Analytics"]
        State["StudyPlanContext<br/>Global State Management"]
        Storage["localStorage<br/>JWT Token + Cache"]
    end

    subgraph Backend["⚙️ BACKEND - Node.js/Express"]
        Auth["Auth Service<br/>Login, Signup, JWT"]
        TaskAPI["Task API<br/>Create, Update, Complete"]
        ExamAPI["Exam API<br/>Create Exams"]
        RescheduleEngine["⚡ Auto-Reschedule Engine<br/>Exam-Aware Logic"]
        RevisionBooster["✨ Revision Booster<br/>1-Day & 7-Day Reviews"]
    end

    subgraph Database["🗄️ DATABASE - MongoDB"]
        Users["Users"]
        Profiles["Profiles"]
        Tasks["Tasks"]
        Exams["Exams"]
        Achievements["Achievements"]
    end

    Frontend -->|HTTP Requests<br/>with JWT| Backend
    Backend -->|JSON Responses| Frontend
    
    Auth -->|Save/Verify| Users
    TaskAPI -->|Create/Update| Tasks
    ExamAPI -->|Create/Store| Exams
    RescheduleEngine -->|Auto-Update| Tasks
    RevisionBooster -->|Add Revision| Tasks
    
    Storage -->|Read/Write| Tasks
    State -->|Sync| Frontend

    style Frontend fill:#e3f2fd
    style Backend fill:#fff3e0
    style Database fill:#f3e5f5
    style RescheduleEngine fill:#ffccbc
    style RevisionBooster fill:#c8e6c9
```

---

## 🎯 Key Features

### 1. **Auto-Reschedule on Exam Creation**
- When user creates exam → System automatically reorganizes tasks
- 2 days before exam: **ONLY exam subject tasks** shown
- Other subjects: **PAUSED** during exam period
- Exam day: **NO tasks** (no studying on exam day)
- Max **4 tasks/day** everywhere

### 2. **Smart Task Distribution**
- Regular days: 3-4 tasks/day (any subject)
- Exam focus window: 2-4 exam subject tasks
- Revision tasks: Auto-generated for completed tasks
- Balanced across available days

### 3. **Revision System**
- When task completed → Auto-create 2 revisions
- 1-Day Review: Next day
- 7-Day Booster: One week later
- Smart scheduling with exam awareness

### 4. **User Journey**
```
Sign Up → Onboarding (Setup Profile & Schedule) → Daily Study → Create Exams → Auto-Reschedule → Dashboard Updates
```

---

## 🔄 Data Flow

```mermaid
flowchart LR
    User["👤 User Action"]
    Frontend["React Component"]
    Request["HTTP Request<br/>POST/PUT/GET"]
    Backend["Express Server"]
    Logic["Business Logic"]
    Database["MongoDB"]
    Response["JSON Response"]
    Update["UI Update"]

    User -->|Click/Input| Frontend
    Frontend -->|Send Data| Request
    Request -->|Validate & Process| Backend
    Backend -->|Execute Logic| Logic
    Logic -->|Query/Save| Database
    Database -->|Return Data| Response
    Response -->|Update State| Frontend
    Frontend -->|Re-render| Update
    Update -->|Show to User| User

    style User fill:#e3f2fd
    style Frontend fill:#e3f2fd
    style Request fill:#fff3e0
    style Backend fill:#fff3e0
    style Logic fill:#fff3e0
    style Database fill:#f3e5f5
    style Response fill:#fff3e0
    style Update fill:#e3f2fd
```

---

## 📋 What Gets Stored in MongoDB

| Collection | Purpose |
|-----------|---------|
| **users** | Login credentials, email |
| **profiles** | User preferences (subjects, schedule duration, study time) |
| **tasks** | Daily study tasks with status (Pending, In Progress, Completed) |
| **exams** | Exam dates and subjects |
| **achievements** | Streaks, badges, milestones |

---

## 🎓 Exam-Aware Rescheduling (The Magic ✨)

```mermaid
graph TD
    A["User Creates Exam<br/>Science on Jan 23"] --> B["⚡ Auto-Reschedule Triggered"]
    B --> C{"Analyze<br/>All Tasks"}
    C --> D["Science Tasks: Keep & Move to Focus Window"]
    C --> E["Other Subjects: Pause during exam period"]
    C --> F["Tasks on exam date: Delete"]
    
    D --> G["Jan 21-22: Only Science tasks<br/>Max 4/day with revisions"]
    E --> H["Jan 21-23: English/Physics/Geography<br/>Hidden from plan"]
    F --> I["Jan 23: No tasks<br/>Focus on exam"]
    
    G --> J["Smart Distribution:<br/>Revision + Regular balanced"]
    H --> K["Auto Resume:<br/>Jan 24+ all subjects back"]
    I --> K
    
    J --> L["✅ Dashboard Refreshes<br/>User sees new schedule"]
    K --> L

    style A fill:#e3f2fd
    style B fill:#ffccbc
    style G fill:#c8e6c9
    style H fill:#ffcdd2
    style L fill:#c8e6c9
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS + Context API |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB (Atlas Cloud) |
| **Auth** | JWT Tokens |
| **Deployment** | Vercel (Frontend) + Heroku/Railway (Backend) |

---

## 📱 User Experience

1. **Sign Up** → Create account with email/password
2. **Onboarding** → Setup subjects, skills, schedule duration (5/15/20/30 days)
3. **Auto Plan Generation** → System generates 3-4 tasks/day for chosen duration
4. **Daily Study** → Complete tasks, earn streaks, unlock achievements
5. **Create Exams** → Add exam dates and subjects
6. **Auto-Reschedule** → System reorganizes plan, focuses on exam subject
7. **Exam Period** → Only exam subject visible for 2 days before exam
8. **Exam Day** → No tasks, student takes exam
9. **Resume** → All subjects resume after exam
10. **Analytics** → Track progress, streaks, achievements

---

## 🎯 Key Algorithms

### Max 4 Tasks Per Day Rule
- Counted every day across the entire plan
- Regular tasks + Revision tasks both count
- Auto-enforced during rescheduling
- Prevents overwhelming user

### 2-Day Focus Window
- Starts: 2 days before exam date
- Ends: Day before exam
- Only exam subject tasks shown
- Other subjects completely hidden (paused)

### Revision Distribution
- After task completion → Create 2 revision tasks
- 1-Day: Complete next day
- 7-Day: Complete 7 days later
- Smart scheduling respects max 4 tasks/day

---

## 📈 Metrics & Analytics

- **Daily Completion Rate**: % of tasks done today
- **Weekly Progress**: Tasks completed this week
- **Subject Performance**: Progress per subject
- **Study Streak**: Consecutive days of studying
- **Achievements**: Badges & milestones unlocked

---

## 🔐 Security

✅ JWT-based authentication  
✅ Password hashing (bcryptjs)  
✅ HTTPS/TLS encryption  
✅ User data isolation (each user sees only their data)  
✅ Input validation on backend  

---

## 📝 Example: Creating an Exam

**Before Exam:**
```
Jan 1-20: Science, English, Physics, Geography (4 tasks/day mix)
```

**User Creates Exam:** Science on Jan 23

**After Auto-Reschedule:**
```
Jan 1-20: Science, English, Physics, Geography (4 tasks/day, unchanged)
Jan 21-22: ONLY Science (2-4 tasks with revisions)
Jan 23: NO tasks (exam day)
Jan 24+: Science, English, Physics, Geography (normal)
```

---

## 🎨 Features Checklist

- ✅ User authentication (Signup/Login)
- ✅ Profile setup with subject selection
- ✅ Automatic study plan generation (3-4 tasks/day)
- ✅ Schedule duration selection (5/15/20/30 days)
- ✅ Daily task tracking
- ✅ Task completion with status updates
- ✅ **Auto-reschedule on exam creation**
- ✅ **Exam-aware task distribution**
- ✅ **Max 4 tasks/day enforcement**
- ✅ **2-day exam focus window**
- ✅ Automatic revision task generation
- ✅ Study streaks & achievements
- ✅ Weekly analytics & charts
- ✅ Real-time plan updates
- ✅ Multiple exam management

---

## 🎬 Getting Started

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup (Future)
```bash
npm install
npm run server
```

### Database
MongoDB Atlas cloud database (connection string in .env)

---

## 📧 Contact & Support

For questions about features or implementation, refer to the documentation above.

---

**Last Updated:** January 6, 2026  
**Status:** ✅ Frontend Complete | ⏳ Backend Ready for Implementation

