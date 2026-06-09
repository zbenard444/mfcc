# 🚀 MILLENNIUM FALCON COMMAND CENTER
## Complete Setup & Deployment Guide

**Private Family Event Management System**  
Built for the annual Star Wars Day event — running since 2015.

---

## TABLE OF CONTENTS
1. [Project Overview](#overview)
2. [Firebase Setup](#firebase-setup)
3. [Firebase Security Rules](#security-rules)
4. [Creating Initial Users](#creating-users)
5. [GitHub Pages Deployment](#github-pages)
6. [First Launch Checklist](#first-launch)
7. [Administrator Guide](#admin-guide)
8. [User Guide](#user-guide)
9. [Backup Guide](#backup-guide)
10. [Troubleshooting](#troubleshooting)
11. [Future Upgrades](#future-upgrades)

---

## 1. PROJECT OVERVIEW {#overview}

### What It Is
A private Progressive Web App (PWA) for planning, organizing, managing, and executing the annual Star Wars Day family event. The app is accessible on desktop, tablet, and mobile, and can be installed as a native-feeling app on any device.

### Technology Stack
- **Frontend:** Pure HTML, CSS, JavaScript (ES Modules) — no build step required
- **Database:** Firebase Firestore (real-time, offline-capable)
- **Authentication:** Firebase Authentication (email/password)
- **Hosting:** GitHub Pages (100% free)
- **PWA:** Service Worker + Web App Manifest

### File Structure
```
mfcc/
├── index.html              ← App entry point, Firebase init
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline/caching)
├── firebase.json           ← Firebase hosting config
├── firestore.rules         ← Firestore security rules
├── firestore.indexes.json  ← Firestore composite indexes
├── css/
│   └── main.css            ← Complete Star Wars theme
├── js/
│   ├── app.js              ← Core: auth, routing, utilities
│   └── pages/
│       ├── dashboard.js    ← Mission Control dashboard
│       ├── tasks.js        ← Task management
│       ├── areas.js        ← Event zone management
│       ├── buildManual.js  ← Digital build guide
│       ├── setupCommand.js ← Real-time setup day dashboard
│       ├── eventDay.js     ← Event Day + Meetings + Milestones + Risks + Lessons
│       ├── inventory.js    ← Inventory tracking
│       ├── budget.js       ← Budget & expenses
│       ├── purchases.js    ← Purchase requests + QR + Knowledge + Reports + Users + Settings
│       └── stopwatch.js    ← Build timers
└── icons/
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-192.png
    └── icon-512.png
```

---

## 2. FIREBASE SETUP {#firebase-setup}

### Step 1 — Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it: `millennium-falcon-cc` (or your choice)
4. **Disable** Google Analytics (not needed)
5. Click **"Create project"**

### Step 2 — Enable Firestore Database
1. In Firebase Console → left sidebar → **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we apply rules next)
4. Choose location: `us-central1` (or nearest to you)
5. Click **"Enable"**

### Step 3 — Enable Authentication
1. Left sidebar → **"Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab → **Email/Password** → **Enable**
4. Click **"Save"**

### Step 4 — Get Your Config Keys
1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **"</>"** (web app)
3. Register app name: `MFCC Web`
4. **Don't** enable Firebase Hosting (we use GitHub Pages)
5. Copy the `firebaseConfig` object — it looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 5 — Update index.html
Open `index.html` and replace the placeholder config:

```javascript
// Find this block near the bottom of index.html:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // ← Replace
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // ← Replace
  projectId: "YOUR_PROJECT_ID",             // ← Replace
  storageBucket: "YOUR_PROJECT_ID.appspot.com",   // ← Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // ← Replace
  appId: "YOUR_APP_ID"                      // ← Replace
};
```

---

## 3. FIREBASE SECURITY RULES {#security-rules}

### Apply the Rules
Option A — Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

Option B — Firebase Console:
1. Go to Firestore → **"Rules"** tab
2. Copy the entire contents of `firestore.rules`
3. Paste into the editor
4. Click **"Publish"**

Option C — For Indexes:
1. Go to Firestore → **"Indexes"** tab
2. Click **"Add index"** for each index in `firestore.indexes.json`
   OR use Firebase CLI: `firebase deploy --only firestore:indexes`

### What the Rules Do
- **No public access** — every read/write requires authentication
- **No guest access** — every user must have an "active" profile document
- **Role enforcement** — only Administrators can manage users and delete records
- **Immutable activity log** — activity can be created but not edited

---

## 4. CREATING INITIAL USERS {#creating-users}

**Important:** Users must be created in two places:
1. **Firebase Authentication** (creates login credentials)
2. **Firestore `users` collection** (creates their app profile)

### Create a User (Admin Process)

**Step 1 — Firebase Console → Authentication:**
1. Go to **Authentication** → **"Users"** tab
2. Click **"Add user"**
3. Enter their email and a temporary password
4. Copy the **User UID** (shown after creation)

**Step 2 — Firebase Console → Firestore:**
1. Go to **Firestore** → **"Data"** tab
2. Click **"Start collection"**
3. Collection ID: `users`
4. Document ID: **paste the User UID from Step 1**
5. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `displayName` | string | `Zach` |
| `email` | string | `zach@email.com` |
| `role` | string | `Administrator` |
| `status` | string | `active` |
| `createdAt` | timestamp | (current time) |

**Initial Users to Create:**

| Name | Role | Status |
|------|------|--------|
| Zach | Administrator | active |
| Tyson | Lead Builder | active |
| Brad | Lead Builder | active |
| Cayla | Lead Builder | active |
| Liz | Lead Builder | active |

**Step 3 — Once deployed:** Use the app's **User Management** page (Admin only) to manage users going forward.

### Share Login Credentials
Send each family member:
- The GitHub Pages URL of the app
- Their email address
- Their temporary password
- Ask them to install the PWA (Add to Home Screen)

---

## 5. GITHUB PAGES DEPLOYMENT {#github-pages}

### Option A — New Repository (Recommended)

1. Create a GitHub account if needed at [github.com](https://github.com)
2. Click **"New repository"**
3. Name: `mfcc` (or `star-wars-command`)
4. Set to **Private** (important for security)
5. Click **"Create repository"**

**Upload files:**
```bash
# If using Git:
git init
git add .
git commit -m "Initial MFCC deployment"
git remote add origin https://github.com/YOUR_USERNAME/mfcc.git
git push -u origin main

# Then in GitHub → Settings → Pages:
# Source: Deploy from branch → main → / (root)
```

**Or drag-and-drop upload:**
1. Go to your repo on GitHub
2. Click **"uploading an existing file"**
3. Drag all MFCC files into the upload area
4. Commit changes

**Enable GitHub Pages:**
1. Repo → **Settings** → **Pages**
2. Source: **"Deploy from a branch"**
3. Branch: **main**, Folder: **/ (root)**
4. Click **Save**
5. Your app will be at: `https://YOUR_USERNAME.github.io/mfcc/`

### Option B — Private Repo with Collaborators
Since the repo is private, only you can see it. To add family members as collaborators to deploy their own changes:
1. Repo → **Settings** → **Collaborators**
2. Add their GitHub usernames

**Note:** GitHub Pages works with private repos if you have GitHub Pro, Team, or Enterprise. For free accounts, the Pages site will be publicly accessible by URL even if the repo is private — **but the app itself requires Firebase login**, so data is still protected.

### Important: Update GitHub Pages URL in Firebase
1. Firebase Console → **Authentication** → **"Settings"** tab
2. Under **"Authorized domains"**: add your GitHub Pages domain
   Example: `yourusername.github.io`

---

## 6. FIRST LAUNCH CHECKLIST {#first-launch}

After deployment, log in as Administrator and complete:

- [ ] **Settings** → Set event name, location, expected guests
- [ ] **Settings** → Add emergency contacts
- [ ] **Areas** → Click "Seed Default Areas" to populate event zones
- [ ] **Build Manual** → Click "Seed Defaults" to populate build entries
- [ ] **Milestones** → Add key planning milestones with dates
- [ ] **Inventory** → Begin adding props, equipment, costumes
- [ ] **Budget** → Set budget limits per category (Settings → Budget icon)
- [ ] **Tasks** → Create initial planning tasks
- [ ] **Risks** → Add known risks (weather, power, etc.)
- [ ] **Knowledge Base** → Add build instructions and FAQs
- [ ] **Test on mobile** → Install PWA on phone (Safari: Share → Add to Home Screen)
- [ ] **Share URL** with all family members

---

## 7. ADMINISTRATOR GUIDE {#admin-guide}

### User Management
- Found under **Admin → User Management**
- Create user profiles after adding them to Firebase Auth
- Set roles: Administrator, Lead Builder, Member
- Disable accounts by setting status to "disabled"
- Users with "pending" status see a waiting screen

### Role Permissions
| Action | Member | Lead Builder | Administrator |
|--------|--------|--------------|---------------|
| View all data | ✅ | ✅ | ✅ |
| Create tasks/records | ✅ | ✅ | ✅ |
| Update records | ✅ | ✅ | ✅ |
| Delete records | ❌ | ✅ | ✅ |
| Approve purchases | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Change settings | ❌ | ❌ | ✅ |

### Readiness System
The readiness percentage is automatically calculated from:
- **Task Completion** (30% weight)
- **Milestone Completion** (20% weight)
- **Inventory Status** (15% weight)
- **Build Manual Coverage** (15% weight)
- **Food Task Completion** (10% weight)
- **Critical Task Completion** (10% weight)

Color thresholds:
- 🔴 **0–49%** — Critical attention needed
- 🟡 **50–79%** — Work in progress
- 🟢 **80–100%** — Ready to launch

---

## 8. USER GUIDE {#user-guide}

### Installing on Your Phone (Recommended)

**iPhone/iPad (Safari):**
1. Open the app URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app appears on your home screen like a native app

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap the **three-dot menu**
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **"Install"**

### Key Features

**Dashboard** — Your command center. Shows countdown to May 4th, readiness %, overdue tasks, activity feed, and quick actions.

**Tasks** — Create and manage all event tasks. Filter by status, priority, area, or owner. Overdue tasks appear highlighted at the top.

**Setup Command** — Real-time dashboard for setup day. Shows current phase, who's doing what, area progress, and blocked tasks. Auto-refreshes every 60 seconds.

**Event Day Mode** — Simplified operations view for May 4th. Shows the schedule, food timing, photo booth schedule, and a quick event log.

**Build Timers** — Start/stop timers for each area build. Records historical times for year-over-year improvement tracking.

**QR Storage** — Generate QR codes for storage bins. Scan to instantly see contents and setup instructions.

**Inventory** — Track all props, equipment, and costumes. Checklist mode for pre-event verification.

**Reports** — Generate printable reports for tasks, inventory, budget, and post-event review. Export data as JSON or CSV.

### Tips
- Changes save automatically and sync to all devices in real-time
- The app works offline — changes sync when connection returns
- Use the Build Timers before and after each area to track time
- Always log lessons learned after each event
- Tag tasks with areas so Setup Command shows correct progress

---

## 9. BACKUP GUIDE {#backup-guide}

### Automatic Backup (Recommended)
Firebase Firestore automatically replicates your data across multiple data centers. Your data is never stored on a single device.

### Manual JSON Backup
1. Log in as Administrator
2. Go to **Reports** page
3. Click **"Export JSON Backup"**
4. Save the downloaded `.json` file to Google Drive
5. Do this monthly and before/after each event

### Recommended Backup Schedule
- **Monthly:** JSON export → Google Drive
- **Pre-event (April):** Full JSON export + CSV exports for tasks and inventory
- **Post-event (May):** Full JSON export with all lessons learned

### Restoring from Backup
If data is lost, contact Firebase support or reimport using the Firebase Admin SDK. The JSON export contains all collections and documents.

### What's NOT in the Backup
- Firebase Authentication accounts (managed separately in Firebase Console)
- Files uploaded to Firebase Storage (if any)

### Sharing Backup Access
Store the backup Google Drive folder and share access with at least 2 family members. Never rely on a single person's account for access.

---

## 10. TROUBLESHOOTING {#troubleshooting}

### "Permission denied" errors
- Ensure Firestore rules have been deployed
- Verify the user document exists in Firestore with `status: "active"`
- Check that the Firebase project ID in `index.html` matches your project

### App won't load offline
- Must be visited while online at least once to cache assets
- Check browser supports Service Workers (all modern browsers do)
- In Chrome DevTools → Application → Service Workers → check status

### Real-time updates not working
- Check internet connection
- Firebase Firestore uses WebSockets — some corporate firewalls block them
- Try on mobile data if on restricted WiFi

### QR codes not showing
- QR codes use the external service `api.qrserver.com`
- Requires internet connection to generate
- Scan with any standard QR scanner app

### App feels slow on first load
- Normal — fonts and Firebase SDK are loading
- After first load, most assets are cached and load instantly
- Install as PWA for fastest experience

### "Unauthorized domain" error on login
- Add your GitHub Pages domain to Firebase Console
- Authentication → Settings → Authorized domains

### Forgot to copy Firebase UID when creating user
- Firebase Console → Authentication → Users
- Click on the user → Copy their UID

---

## 11. FUTURE UPGRADE RECOMMENDATIONS {#future-upgrades}

### Near-Term (Easy)
- [ ] **Photo uploads** — Add Firebase Storage for actual photo uploads vs. links
- [ ] **Push notifications** — Task reminders and overdue alerts via Firebase Cloud Messaging
- [ ] **Volunteer tracking** — Add non-family volunteers with limited access roles
- [ ] **Shopping list integration** — Auto-generate Amazon/Home Depot shopping lists from purchase requests
- [ ] **Weather widget** — Embed weather forecast on Event Day dashboard

### Medium-Term
- [ ] **Mobile camera QR scan** — Use device camera to scan QR codes within the app
- [ ] **Drag-and-drop task boards** — Kanban-style view for task management
- [ ] **Guest check-in system** — Simple QR-based guest arrival tracking
- [ ] **Time-lapse setup tracking** — Photo uploads at intervals to document setup progress
- [ ] **Voice notes** — Record audio notes on mobile during setup

### Long-Term
- [ ] **AI task suggestions** — Use past lessons to auto-suggest prep tasks each year
- [ ] **Budget forecasting** — Predict next year's budget from historical spend
- [ ] **Guest portal** — Limited public-facing page for guests (parking, schedule)
- [ ] **Multi-event support** — Expand to manage other family events
- [ ] **Video build guides** — Embed YouTube unlisted videos in build manual entries

### Architecture Upgrades (If Needed)
- Consider **Firestore Rules v2** for more granular permissions as team grows
- Consider **Firebase Extensions** for automatic backups to Google Cloud Storage
- Consider **GitHub Actions** for automated deployment on push

---

## DATABASE SCHEMA REFERENCE

### Collection: `users`
```
{
  displayName: string,
  email: string,
  role: "Administrator" | "Lead Builder" | "Member",
  status: "active" | "pending" | "disabled",
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### Collection: `tasks`
```
{
  title: string,
  description: string,
  area: string,
  priority: "Critical" | "High" | "Medium" | "Low",
  owner: string,
  backupOwner: string,
  status: "Not Started" | "In Progress" | "Waiting" | "Blocked" | "Completed" | "Archived",
  dueDate: string (YYYY-MM-DD),
  estimatedHours: number,
  actualHours: number,
  dependencies: string[] (task IDs),
  notes: string,
  driveLink: string,
  createdAt: timestamp,
  createdBy: string (uid),
  updatedAt: timestamp,
  updatedBy: string (uid),
  completedAt: timestamp,
  completedBy: string (uid)
}
```

### Collection: `tasks/{taskId}/comments`
```
{
  text: string,
  userId: string,
  userName: string,
  timestamp: timestamp
}
```

### Collection: `areas`
```
{
  name: string,
  icon: string,
  description: string,
  setupInstructions: string,
  teardownInstructions: string,
  requiredProps: string,
  requiredLabor: number,
  estimatedBuildTime: number,
  estimatedTeardownTime: number,
  pastProblems: string,
  improvementNotes: string,
  historicalNotes: string,
  readiness: number (0-100),
  setupComplete: boolean,
  driveLink: string,
  createdAt: timestamp
}
```

### Collection: `buildManual`
```
{
  name: string,
  category: string,
  difficulty: "Easy" | "Medium" | "Hard" | "Expert",
  owner: string,
  description: string,
  steps: string[],
  disassemblySteps: string[],
  toolsRequired: string,
  storageLocation: string,
  estimatedBuildTime: number,
  estimatedTeardownTime: number,
  historicalNotes: string,
  driveLink: string,
  createdAt: timestamp
}
```

### Collection: `inventory`
```
{
  name: string,
  category: string,
  quantity: number,
  location: string,
  owner: string,
  condition: "Excellent" | "Good" | "Fair" | "Poor",
  status: "Available" | "Needs Repair" | "Missing" | "Retired",
  replacementCost: number,
  notes: string,
  photoUrl: string,
  createdAt: timestamp
}
```

### Collection: `expenses`
```
{
  description: string,
  category: string,
  amount: number,
  date: string (YYYY-MM-DD),
  year: string,
  purchasedBy: string,
  receiptUrl: string,
  notes: string,
  createdAt: timestamp,
  createdBy: string
}
```

### Collection: `milestones`
```
{
  title: string,
  description: string,
  dueDate: string (YYYY-MM-DD),
  status: "Pending" | "In Progress" | "Completed" | "At Risk",
  completedAt: timestamp,
  createdAt: timestamp
}
```

### Collection: `risks`
```
{
  title: string,
  description: string,
  likelihood: "Low" | "Medium" | "High",
  impact: "Low" | "Medium" | "High" | "Critical",
  mitigation: string,
  owner: string,
  status: "Open" | "Monitoring" | "Mitigated" | "Closed",
  createdAt: timestamp
}
```

### Collection: `meetings`
```
{
  title: string,
  date: string (YYYY-MM-DD),
  type: string,
  attendees: string[],
  notes: string,
  decisions: string,
  actionItems: string[],
  ideas: string,
  createdAt: timestamp
}
```

### Collection: `lessons`
```
{
  title: string,
  year: number,
  type: string,
  category: string,
  description: string,
  improvement: string,
  createdAt: timestamp
}
```

### Collection: `knowledge`
```
{
  title: string,
  category: string,
  content: string,
  tags: string[],
  link: string,
  createdAt: timestamp
}
```

### Collection: `purchases`
```
{
  item: string,
  category: string,
  estimatedCost: number,
  actualCost: number,
  requestedBy: string,
  approvedBy: string,
  status: "Requested" | "Approved" | "Purchased" | "Delivered" | "Denied",
  purchaseDate: string,
  store: string,
  notes: string,
  receiptUrl: string,
  createdAt: timestamp
}
```

### Collection: `storageBins`
```
{
  binId: string,
  name: string,
  location: string,
  contents: string,
  setupInstructions: string,
  notes: string,
  createdAt: timestamp
}
```

### Collection: `timingRecords`
```
{
  area: string,
  type: "Setup" | "Teardown" | "Build",
  durationMs: number,
  durationFormatted: string,
  durationMinutes: number,
  year: number,
  notes: string,
  historical: boolean,
  recordedBy: string,
  createdAt: timestamp
}
```

### Collection: `activity`
```
{
  action: string,
  details: object,
  userId: string,
  userName: string,
  timestamp: timestamp
}
```

### Collection: `settings`
```
// Document ID: "app"
{
  eventName: string,
  eventDate: string,
  startYear: number,
  expectedGuests: number,
  location: string,
  parkingNotes: string,
  contact_Zach: string,
  contact_Tyson: string,
  contact_Brad: string,
  contact_Cayla: string,
  contact_Liz: string
}

// Document ID: "budget_{year}" (e.g., "budget_2026")
{
  Filament: number,
  Paint: number,
  Lumber: number,
  // ... one field per budget category
}
```

---

*May the Fourth be with you — always.* 🚀
