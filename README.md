# API Response Manager

An interactive tool for developers to share API responses with anyone using a link that can be shared project-wise.

## Features

- **User Authentication:** Secure registration and login for developers.
- **Project Management:** Create and manage multiple projects or workspaces.
- **API Response Capturing:** A proxy server to capture and store API responses from a local backend.
- **Shareable Links:** Generate unique, shareable links for projects.
- **Collaboration:** Comment on API responses to facilitate team communication.

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

1. **Register and Log In:**
   - Open your browser and navigate to `http://localhost:5173`.
   - Register for a new account and log in.

2. **Create a Project:**
   - Once logged in, you'll be redirected to the homepage.
   - Click on the "Projects" link to create a new project.

3. **Configure the Proxy:**
   - Open the `proxy/server.js` file.
   - Update the `target` to your local backend URL.
   - Set the `PROJECT_ID` to the ID of the project you created.

4. **Capture API Responses:**
   - Run your API client (e.g., Postman, cURL) and point it to the proxy server at `http://localhost:8080`.
   - The proxy will forward the requests to your local backend and send the responses to the API Response Manager.

5. **Share and Collaborate:**
   - In the frontend, you can view the captured API responses for your project.
   - Generate a shareable link to share your project with others.
   - Add comments to API responses to collaborate with your team.
