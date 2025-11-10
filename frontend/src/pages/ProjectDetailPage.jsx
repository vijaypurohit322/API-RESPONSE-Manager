import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import responseService from '../services/responseService';
import commentService from '../services/commentService';
import authService from '../services/authService';
import '../App.css';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [newResponseCount, setNewResponseCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastResponseCount, setLastResponseCount] = useState(0);

  useEffect(() => {
    loadProjectData();
    
    // Set up polling for real-time updates every 5 seconds
    const pollInterval = setInterval(() => {
      loadResponses();
    }, 10000);
    
    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const projectData = await projectService.getProject(id);
      setProject(projectData.data);
      const responsesData = await responseService.getResponses(id);
      setResponses(responsesData.data);
      setLastResponseCount(responsesData.data.length); // Track initial count
      setLoading(false);
    } catch (error) {
      console.error('Failed to load project data', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        authService.logout();
        navigate('/login');
      }
      
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      setIsPolling(true);
      const responsesData = await responseService.getResponses(id);
      const newResponses = responsesData.data;
      
      // Only show notification if there are genuinely NEW responses
      if (newResponses.length > lastResponseCount) {
        const newCount = newResponses.length - lastResponseCount;
        setNewResponseCount(newCount);
        setShowNotification(true);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
          setNewResponseCount(0);
        }, 3000);
        
        setResponses(newResponses);
        setLastResponseCount(newResponses.length); // Update the baseline
      } else if (newResponses.length !== responses.length) {
        // Update responses without notification if count changed but not increased
        setResponses(newResponses);
        setLastResponseCount(newResponses.length);
      }
      
      // Keep polling indicator visible for 3 seconds
      setTimeout(() => {
        setIsPolling(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to refresh responses', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        authService.logout();
        navigate('/login');
      }
      
      setIsPolling(false);
    }
  };

  const handleResponseClick = async (response) => {
    setSelectedResponse(response);
    try {
      const commentsData = await commentService.getComments(response._id);
      setComments(commentsData.data);
    } catch (error) {
      console.error('Failed to load comments', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedResponse) return;

    try {
      await commentService.createComment(selectedResponse._id, newComment);
      setNewComment('');
      const commentsData = await commentService.getComments(selectedResponse._id);
      setComments(commentsData.data);
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const copyShareLink = async () => {
    // If project not loaded yet, use project ID to fetch it
    let token = project?.shareToken;
    
    if (!token) {
      try {
        const projectData = await projectService.getProject(id);
        token = projectData.data.shareToken;
        setProject(projectData.data);
      } catch (error) {
        console.error('Failed to get project', error);
        alert('Unable to generate share link. Please try again.');
        return;
      }
    }
    
    const link = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareLink(link);
      setTimeout(() => setShareLink(''), 3000);
    } catch (error) {
      console.error('Failed to copy link', error);
      // Fallback: show the link in an alert
      alert(`Share link copied: ${link}`);
      setShareLink(link);
      setTimeout(() => setShareLink(''), 3000);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location = '/login';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'var(--secondary-color)';
    if (statusCode >= 400 && statusCode < 500) return 'var(--warning-color)';
    if (statusCode >= 500) return 'var(--danger-color)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">📡 API Response Manager</div>
        <ul className="navbar-nav">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/projects">Projects</Link></li>
          <li>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link to="/projects" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'inline-block' }}>
              ← Back to Projects
            </Link>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {project?.name || 'Project Responses'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {project ? `Share Token: ${project.shareToken}` : `Project ID: ${id}`}
              </p>
              {isPolling && (
                <span style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--primary-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: 'var(--primary-color)', 
                    borderRadius: '50%',
                    animation: 'pulse 3.5s ease-in-out infinite'
                  }}></span>
                  Checking for updates...
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={copyShareLink} 
            className="btn btn-outline"
          >
            {shareLink ? '✓ Copied!' : '🔗 Copy Share Link'}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading responses...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedResponse ? '1fr 1fr' : '1fr', gap: '2rem' }}>
            {/* Responses List */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                API Responses ({responses.length})
              </h2>
              {responses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No responses yet</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Configure the proxy server to start capturing API responses
                  </p>
                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Quick Setup:</p>
                    <code style={{ display: 'block', fontSize: '0.85rem' }}>
                      1. Update proxy/server.js with PROJECT_ID: "{id}"<br/>
                      2. Start proxy: npm start --prefix proxy<br/>
                      3. Point your API calls to http://localhost:8080
                    </code>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {responses.map((response) => (
                    <div
                      key={response._id}
                      className="card"
                      onClick={() => handleResponseClick(response)}
                      style={{
                        cursor: 'pointer',
                        border: selectedResponse?._id === response._id ? '2px solid var(--primary-color)' : '2px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            backgroundColor: response.requestMethod === 'GET' ? '#dbeafe' : response.requestMethod === 'POST' ? '#d1fae5' : '#fef3c7',
                            color: response.requestMethod === 'GET' ? '#1e40af' : response.requestMethod === 'POST' ? '#065f46' : '#92400e'
                          }}>
                            {response.requestMethod}
                          </span>
                          <span style={{
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            backgroundColor: getStatusColor(response.responseStatusCode) === 'var(--secondary-color)' ? '#d1fae5' : '#fee2e2',
                            color: getStatusColor(response.responseStatusCode) === 'var(--secondary-color)' ? '#065f46' : '#991b1b'
                          }}>
                            {response.responseStatusCode}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {formatDate(response.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {response.requestUrl}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Response Details */}
            {selectedResponse && (
              <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
                <div className="card">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Response Details</h3>
                  
                  {/* Request Info */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Request</h4>
                    <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Method:</strong> {selectedResponse.requestMethod}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>URL:</strong> <code>{selectedResponse.requestUrl}</code>
                      </div>
                      {selectedResponse.requestBody && Object.keys(selectedResponse.requestBody).length > 0 && (
                        <div>
                          <strong>Body:</strong>
                          <pre style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem', overflow: 'auto', maxHeight: '150px' }}>
                            {JSON.stringify(selectedResponse.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Response Info */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Response</h4>
                    <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Status:</strong> <span style={{ color: getStatusColor(selectedResponse.responseStatusCode) }}>{selectedResponse.responseStatusCode}</span>
                      </div>
                      {selectedResponse.responseBody && (
                        <div>
                          <strong>Body:</strong>
                          <pre style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '0.25rem', overflow: 'auto', maxHeight: '200px' }}>
                            {typeof selectedResponse.responseBody === 'string' ? selectedResponse.responseBody : JSON.stringify(selectedResponse.responseBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      Comments ({comments.length})
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                      {comments.map((comment) => (
                        <div key={comment._id} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {formatDate(comment.createdAt)}
                          </div>
                          <div style={{ fontSize: '0.95rem' }}>{comment.comment}</div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddComment}>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <textarea
                          className="form-control"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows="3"
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Add Comment
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
