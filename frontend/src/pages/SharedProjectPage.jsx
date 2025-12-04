import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import '../App.css';

const SharedProjectPage = () => {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedProject();
  }, [token]);

  // VITE_API_URL already includes /api suffix, so we use it directly
  const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.tunnelapi.in/api';

  const loadSharedProject = async () => {
    try {
      setLoading(true);
      console.log(`Loading shared project with token: ${token}`);
      console.log(`API URL: ${API_URL}`);
      
      // Get project by share token
      console.log(`Fetching project from: ${API_URL}/projects/share/${token}`);
      const projectRes = await axios.get(`${API_URL}/projects/share/${token}`);
      console.log('Project data received:', projectRes.data);
      setProject(projectRes.data);
      
      // Get responses for this project
      console.log(`Fetching responses for project ID: ${projectRes.data._id}`);
      const responsesRes = await axios.get(`${API_URL}/responses/${projectRes.data._id}`);
      console.log('Responses data received:', responsesRes.data);
      setResponses(responsesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load shared project', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 404) {
        setError('Project not found');
      } else if (error.response?.status === 400) {
        setError('Invalid share link');
      } else if (error.response?.status === 429) {
        setError('Too many requests - please try again later');
      } else {
        setError('Failed to load project');
      }
      setLoading(false);
    }
  };

  const handleResponseClick = (response) => {
    setSelectedResponse(response);
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

  if (loading) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            <span>API Response Manager</span>
          </div>
          <ThemeToggle />
        </nav>
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Loading Project...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Please wait while we fetch the project data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            <span>API Response Manager</span>
          </div>
          <ThemeToggle />
        </nav>
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--danger-color)' }}>
              {error}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {error === 'Project not found' 
                ? 'This project does not exist or the share link is invalid.'
                : 'There was an error loading the project. Please try again later.'}
            </p>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Possible reasons:</p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                <li>The share link is incorrect or expired</li>
                <li>The project has been deleted</li>
                <li>The server is temporarily unavailable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span>API Response Manager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            👁️ Viewing Shared Project
          </span>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>SHARED PROJECT</div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {project.name}
                </h1>
                <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Created {formatDate(project.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.5rem' }}>📊</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
                  {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedResponse ? '1fr 1fr' : '1fr', gap: '2rem' }}>
          {/* Responses List */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              API Responses ({responses.length})
            </h2>
            {responses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No API Responses Yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  This project exists but doesn't have any captured API responses yet.
                </p>
                <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'left' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    💡 What does this mean?
                  </p>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>The project owner hasn't captured any API responses yet</li>
                    <li>They need to configure the proxy server to start capturing</li>
                    <li>Once responses are captured, they will appear here automatically</li>
                  </ul>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic' }}>
                    Check back later or contact the project owner for updates.
                  </p>
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
                <div>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedProjectPage;
