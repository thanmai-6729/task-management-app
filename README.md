# Task Management Application

A professional full-stack web application for managing tasks with authentication, filtering, and real-time updates.

## 🚀 Features

- ✅ User Authentication (Register/Login with JWT)
- ✅ Create, Read, Update, Delete Tasks
- ✅ Task Filtering (Status, Priority)
- ✅ Search Functionality
- ✅ Task Statistics Dashboard
- ✅ Responsive Design
- ✅ Secure Password Hashing
- ✅ RESTful API Architecture

## 🛠️ Tech Stack

**Backend:**
- Node.js
- Express.js
- MySQL (with mysql2)
- JWT (jsonwebtoken)
- Bcrypt

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## ⚙️ Installation & Setup

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/task-management-app.git
   cd task-management-app
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up MySQL Database**
```sql
   CREATE DATABASE task_management;
```

4. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=task_management
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=development
```

5. **Run the application**
```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
```

6. **Access the application**
   - Backend API: `http://localhost:5000`
   - Frontend: `http://localhost:5000` (or your frontend URL)

## 📁 Project Structure
```
task-management-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── utils/
│   │   └── validation.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── index.html
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- SQL injection prevention (parameterized queries)
- CORS configuration
- Input validation and sanitization

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Tasks
- `GET /api/tasks` - Get all tasks (Protected)
- `GET /api/tasks/stats` - Get task statistics (Protected)
- `GET /api/tasks/:id` - Get single task (Protected)
- `POST /api/tasks` - Create new task (Protected)
- `PUT /api/tasks/:id` - Update task (Protected)
- `DELETE /api/tasks/:id` - Delete task (Protected)

## 👨‍💻 Development

Built as part of **Global Trend Full Stack Development Internship** skill assessment.

## 📄 License

MIT License

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

Your Name - Gundekari Thanmai

Project Link:  https://github.com/thanmai-6729/task-management-app

