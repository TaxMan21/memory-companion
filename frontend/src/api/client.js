const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('mc_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('mc_token', token);
    } else {
      localStorage.removeItem('mc_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = res.status;
      error.code = data.code;
      throw error;
    }

    return data;
  }

  // Auth
  signup(email, password, name, tosAccepted, privacyAccepted, marketingConsent) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, tosAccepted, privacyAccepted, marketingConsent })
    });
  }

  signin(email, password) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  signout() {
    return this.request('/auth/signout', { method: 'POST' });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Memories
  getMemories() {
    return this.request('/memories');
  }

  getMemory(id) {
    return this.request(`/memories/${id}`);
  }

  createMemory(title, content, mood, tags) {
    return this.request('/memories', {
      method: 'POST',
      body: JSON.stringify({ title, content, mood, tags })
    });
  }

  updateMemory(id, data) {
    return this.request(`/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteMemory(id) {
    return this.request(`/memories/${id}`, { method: 'DELETE' });
  }

  // AI
  aiChat(message) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  getInsights() {
    return this.request('/ai/insights');
  }

  // Subscription
  createCheckout() {
    return this.request('/subscription/create-checkout', { method: 'POST' });
  }

  getSubscriptionStatus() {
    return this.request('/subscription/status');
  }

  cancelSubscription() {
    return this.request('/subscription/cancel', { method: 'POST' });
  }

  // Data & Privacy
  exportData() {
    return this.request('/data/export');
  }

  deleteAccount() {
    return this.request('/data/account', { method: 'DELETE' });
  }

  requestDeletion() {
    return this.request('/data/request-deletion', { method: 'POST' });
  }
}

export const api = new ApiClient();
export default api;
