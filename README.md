# 🧩 ManMitra — Backend Service (`backend_manmitra/`)

## 📖 Overview
The **ManMitra Backend** is the core engine of the ManMitra Student Web Portal. It powers all the main features that students, volunteers, counselors, and admins use, including:

- **User accounts & login** (students, counselors, volunteers, admins)  
- **Journals & daily reflections**  
- **Well-being tasks & reminders**  
- **Booking sessions with counselors**  
- **Notifications & real-time alerts**  
- **Integration with the AI microservice** (for chat support and moderation)  

Think of this as the **central hub** that manages student interactions, keeps their data safe, and connects all the parts of ManMitra together.

---

## 🚀 Key Features

### 👤 Student Accounts
- Students can **register and login** anonymously by default  
- Profile data and progress are **securely stored**  

### 📝 Journals & Well-being Tasks
- Track moods, emotions, and daily reflections  
- Receive reminders for tasks, mindfulness activities, and self-checks  

### 💬 Chat & AI Integration
- Messages sent via the **Bestie Chatbot** are safely analyzed for risk  
- Unsafe messages are flagged and counselors are **automatically alerted**  

### 🛡️ Safety & Escalation
- High-risk messages or events trigger **immediate notifications** to counselors and admins  
- Escalation happens **confidentially and securely**  
- Only authorized personnel can access sensitive information  

### 🔔 Notifications
- Real-time updates through web notifications  
- Optional email or SMS alerts for urgent matters  
- Daily summaries and reminders to support student well-being  

### 📊 Insights for Counselors/Admins
- Anonymous and aggregated data on student engagement  
- Helps counselors **identify trends** and provide timely support  
- Keeps student privacy intact while supporting decision-making  

---

## 🧩 How It Works (Simple Version)
1. **Student interacts** with the portal or chatbot  
2. **Backend records and manages** journals, tasks, bookings, and events  
3. **AI microservice checks** messages for safety and generates responses  
4. **High-risk events** trigger alerts to counselors and admins  
5. **Analytics are generated** anonymously to guide support efforts  

> The backend is like the **silent organizer**, making sure every action is tracked safely and support is delivered when needed.

---

## ⚡ Benefits
- **Safe & supportive:** Monitors messages for safety  
- **Confidential:** Students can interact anonymously  
- **Helpful:** Reminders, journals, and chat support promote mental well-being  
- **Insightful:** Provides counselors with anonymized data for better guidance  

---

## 🛠️ Quick Start (Demo / Development)
1. **Install dependencies**
```bash
cd backend_manmitra
npm install
