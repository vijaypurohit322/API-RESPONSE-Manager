# API Response Manager - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or later)
- MongoDB (running locally or connection string)
- npm

### Installation Steps

#### 1. Install Dependencies

```bash
# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend

# Install proxy server dependencies
npm install --prefix proxy
```

#### 2. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### 3. Start the Backend Server
```bash
npm start --prefix backend
```
Backend will run on `http://localhost:5000`

#### 4. Start the Frontend Server
```bash
npm run dev --prefix frontend
```
Frontend will run on `http://localhost:5173`

#### 5. Configure and Start Proxy (Optional)
Edit `proxy/server.js` and update:
- `target`: Your local backend URL
- `PROJECT_ID`: The ID of your project (get this after creating a project)

```bash
npm start --prefix proxy
```
Proxy will run on `http://localhost:8080`

## 📖 How to Use

### 1. Register and Login
- Navigate to `http://localhost:5173`
- Click "Sign up" to create a new account
- Login with your credentials

### 2. Create a Project
- Click on "Projects" in the navigation
- Click "+ New Project"
- Enter a project name and create

### 3. Capture API Responses
- Copy your project ID from the project details page
- Update `proxy/server.js` with your PROJECT_ID
- Start the proxy server
- Point your API calls to `http://localhost:8080` instead of your backend
- The proxy will capture and store all API responses

### 4. View and Collaborate
- Click on a project to view all captured API responses
- Click on any response to see details
- Add comments to responses for team collaboration
- Use the "Copy Share Link" button to share with team members

## 🎨 Features

✅ **User Authentication** - Secure login and registration
✅ **Project Management** - Create and organize multiple projects
✅ **API Response Capture** - Automatic capture via proxy server
✅ **Response Details** - View request/response headers, body, and status
✅ **Shareable Links** - Generate unique links for projects
✅ **Comments** - Add comments to API responses
✅ **Modern UI** - Clean, responsive design

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT, bcrypt
- **Proxy**: http-proxy-middleware

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/share/:token` - Get project by share token

### Responses
- `GET /api/responses/:projectId` - Get all responses for a project
- `POST /api/responses` - Create new response (used by proxy)

### Comments
- `GET /api/comments/:responseId` - Get comments for a response
- `POST /api/comments` - Add comment to response

## 🔧 Troubleshooting

### Port Already in Use
If ports 5000, 5173, or 8080 are in use:
- Backend: Change `PORT` in `backend/server.js`
- Frontend: Vite will automatically use next available port
- Proxy: Change `PORT` in `proxy/server.js`

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `backend/database.js`
- Default: `mongodb://localhost:27017/api-response-manager`

### CORS Issues
- Backend CORS is configured to allow all origins
- For production, update CORS settings in `backend/server.js`

## 📦 Project Structure

```
API-RESPONSE-Manager/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── services/    # API services
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── index.html
├── proxy/
│   └── server.js        # Proxy server
└── README.md
```

## 🎯 Next Steps

1. **Customize Styling** - Modify CSS variables in `frontend/src/index.css`
2. **Add Features** - Extend with search, filters, export functionality
3. **Deploy** - Deploy to production (Netlify, Vercel, Heroku)
4. **Security** - Add rate limiting, input validation, HTTPS

## 📄 License

ISC License

## 👨‍💻 Author

Vijay Singh Purohit
Email: vijaypurohit322@gmail.com

---

**Version**: 1.0.0  
**Last Updated**: November 2025
