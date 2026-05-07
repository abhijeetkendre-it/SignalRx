import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api' });

export const getStats = (projectId) => API.get('/dashboard/stats', { params: { project_id: projectId } }).then(r => r.data);
export const getProjects = () => API.get('/projects').then(r => r.data);
export const getProject = (id) => API.get(`/projects/${id}`).then(r => r.data);
export const createProject = (data) => API.post('/projects', data).then(r => r.data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data).then(r => r.data);
export const getPosts = (projectId, source) => API.get('/posts', { params: { project_id: projectId, source } }).then(r => r.data);
export const getAnalyzedPosts = (projectId) => API.get('/posts/analyzed', { params: { project_id: projectId } }).then(r => r.data);
export const getSignals = (projectId, riskLevel) => API.get('/signals', { params: { project_id: projectId, risk_level: riskLevel } }).then(r => r.data);
export const getAlerts = (projectId) => API.get('/alerts', { params: { project_id: projectId } }).then(r => r.data);
export const getPipelineInfo = () => API.get('/pipeline/info').then(r => r.data);
export const getTimeline = (projectId) => API.get('/timeline', { params: { project_id: projectId } }).then(r => r.data);
export const getEngines = () => API.get('/engines').then(r => r.data);
export const ingestReddit = (projectId) => API.post('/ingest/reddit', null, { params: { project_id: projectId } }).then(r => r.data);
