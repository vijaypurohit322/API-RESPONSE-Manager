# API Response Manager

An interactive tool for developers to capture, share, and collaborate on API responses. Share your API testing results with team members using unique project links - no login required for viewers.

![Demo](https://drive.google.com/uc?export=view&id=12eR09C2PcgCbvThRKtoSwpdEBfOa1eTb)
![Dashboard](frontend/public/images/Dashboard.png)
![Project](frontend/public/images/Projects.png)
![Project Details](frontend/public/images/ProjDetails.png)
## ✨ Features

- **🔐 User Authentication:** Secure JWT-based registration and login
- **📊 Project Management:** Create and organize multiple projects
- **🎯 API Response Capturing:** Automatic capture via proxy server
- **🔗 Shareable Links:** Generate unique, public links for each project
- **💬 Collaboration:** Add comments to API responses for team discussions
- **⚡ Real-time Updates:** Automatic polling for new responses (every 10 seconds)
- **🎨 Modern UI:** Clean, responsive design with intuitive navigation
- **🔄 Auto-redirect:** Automatic logout and redirect on session expiry

## Tech Stack

- **Backend:** Node.js, Express, MongoDB
- **Frontend:** React, Vite
- **Proxy Server:** Node.js, http-proxy-middleware

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm
- MongoDB

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/api-response-manager.git
   cd api-response-manager
   ```

2. **Install backend dependencies:**
   ```bash
   npm install --prefix backend
   ```

3. **Install frontend dependencies:**
   ```bash
   npm install --prefix frontend
   ```

4. **Install proxy server dependencies:**
   ```bash
   npm install --prefix proxy
   ```

### Running the Application

1. **Start MongoDB:**
   - Make sure your MongoDB server is running.

2. **Start the backend server:**
   ```bash
   npm start --prefix backend
   ```
   The backend will be available at `http://localhost:5000`.

3. **Start the frontend server:**
   ```bash
   npm run dev --prefix frontend
   ```
   The frontend will be available at `http://localhost:5173`.

4. **Start the proxy server:**
   ```bash
   npm start --prefix proxy
   ```
   The proxy will be available at `http://localhost:8080`.

### How to Use

#### Step 1: Register and Create a Project

1. **Register and Log In:**
   - Open your browser and navigate to `http://localhost:5173`
   - Click "Sign up" to create a new account
   - Login with your credentials

2. **Create a Project:**
   - Click on "Projects" in the navigation
   - Click "+ New Project" button
   - Enter a project name (e.g., "My API Testing")
   - Click "Create Project"
   - **Copy the Project ID** from the project detail page (shown under the project name)

#### Step 2: Connect Your Backend with the Proxy

3. **Configure the Proxy Server:**
   
   Open `proxy/server.js` and update these two values:

   ```javascript
   const target = 'http://localhost:3000'; // Change to YOUR backend URL
   const PROJECT_ID = 'your-project-id-here'; // Paste the Project ID you copied
   ```

   **Example Configuration:**
   ```javascript
   // If your backend runs on port 4000
   const target = 'http://localhost:4000';
   const PROJECT_ID = '674f8a2b1c9d4e0012345678';
   ```

4. **Start the Proxy Server:**
   ```bash
   npm start --prefix proxy
   ```
   The proxy will run on `http://localhost:8080`

#### Step 3: Capture API Responses

5. **Point Your API Calls to the Proxy:**

   Instead of calling your backend directly, route your requests through the proxy:

   **Before (Direct to Backend):**
   ```bash
   curl http://localhost:3000/api/users
   ```

   **After (Through Proxy):**
   ```bash
   curl http://localhost:8080/api/users
   ```

   **In Your Application Code:**
   
   ```javascript
   // JavaScript/React
   const API_BASE_URL = 'http://localhost:8080'; // Instead of your backend URL
   
   fetch(`${API_BASE_URL}/api/users`)
     .then(res => res.json())
     .then(data => console.log(data));
   ```

   ```python
   # Python
   import requests
   
   API_BASE_URL = 'http://localhost:8080'  # Instead of your backend URL
   response = requests.get(f'{API_BASE_URL}/api/users')
   print(response.json())
   ```

   **Using Postman:**
   - Change your request URL from `http://localhost:3000/api/users` to `http://localhost:8080/api/users`
   - Send your requests as normal
   - All responses will be automatically captured

6. **How It Works:**
   - The proxy forwards your request to your actual backend
   - Your backend processes the request normally
   - The proxy captures the response before sending it back to you
   - The captured response is stored in the API Response Manager
   - You get the response as if you called the backend directly
   - **Real-time Updates**: The project page automatically checks for new responses every 5 seconds
   - **Instant Notifications**: You'll see a notification when new responses are captured

#### Step 4: View and Share Responses

7. **View Captured Responses:**
   - Go to your project in the API Response Manager
   - Click on the project to see all captured API responses
   - Click on any response to view full details (request/response body, headers, status)

8. **Share with Your Team:**
   - Click "Copy Share Link" button in the project detail page
   - Share the link with anyone (no login required for them)
   - They can view all API responses and add comments

9. **Collaborate:**
   - Click on any API response to view details
   - Add comments to discuss specific responses
   - Team members can view and comment on shared projects

## Use Cases

### 1. **API Development & Testing**
```bash
# Test your API endpoints through the proxy
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# All responses are automatically logged
```

### 2. **Bug Reporting**
- Capture the exact API response that caused a bug
- Share the link with your team
- Everyone can see the exact request/response that failed

### 3. **API Documentation**
- Capture real API responses as examples
- Share with frontend developers
- Show actual response structures

### 4. **Client Demos**
- Capture API responses during development
- Share with clients to show progress
- No need to give them access to your backend

## Troubleshooting

**Q: My responses aren't being captured**
- Verify the proxy server is running on port 8080
- Check that PROJECT_ID in `proxy/server.js` matches your project ID
- Ensure you're sending requests to `http://localhost:8080` not your backend directly

**Q: Getting connection errors**
- Verify your backend is running
- Check the `target` URL in `proxy/server.js` matches your backend URL
- Make sure MongoDB is running for the API Response Manager backend

**Q: Proxy returns 500 error**
- Check the proxy server logs for errors
- Verify the API Response Manager backend is running on port 5000
- Ensure PROJECT_ID is a valid MongoDB ObjectId

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Contributed by Google Jules

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Version:** 2.0.0  <br>
**Last Updated:** November 10, 2025 <br>
**Author:** Vijay Singh Purohit <br>
**Email:** <a href="mailto:vijaypurohit322@gmail.com?">vijaypurohit322@gmail.com</a>

## 🎉 What's New in v2.0.1

- ✅ Real-time polling for automatic response updates
- ✅ Improved authentication with auto-redirect on session expiry
- ✅ Enhanced UI with better visual feedback
- ✅ Shareable project links with public access
- ✅ Comment system for team collaboration
- ✅ Comprehensive error handling
- ✅ Better proxy logging and diagnostics 

