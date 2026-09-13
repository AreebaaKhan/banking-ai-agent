/**
 * API client — centralized HTTP layer for all backend communication.
 * Handles token storage, auto-refresh, and error normalization.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class ApiClient {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.onAuthError = null; // callback when auth fails

    // Restore tokens from localStorage (client-side only)
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    }
  }

  setTokens(access, refresh) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // If 401, try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          this.clearTokens();
          if (this.onAuthError) this.onAuthError();
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${response.status})`);
      }

      return response;
    } catch (error) {
      if (error.message === "Failed to fetch") {
        throw new Error("Unable to connect to server. Please check if the backend is running.");
      }
      throw error;
    }
  }

  async tryRefreshToken() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", data.access_token);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async get(path) {
    const res = await this.request(path);
    return res.json();
  }

  async post(path, body) {
    const res = await this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async delete(path) {
    const res = await this.request(path, { method: "DELETE" });
    return res.json();
  }

  /**
   * Send a chat message and return a ReadableStream for SSE processing.
   */
  async sendMessageStream(message, conversationId = null, language = "EN") {
    const url = `${API_BASE}/api/chat/send`;
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        language,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to send message");
    }

    return response;
  }

  // ─── Auth Methods ─────────────────────────────────────────────

  async signup(email, fullName, password, city = null) {
    const data = await this.post("/api/auth/signup", {
      email,
      full_name: fullName,
      password,
      city,
    });
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async login(email, password) {
    const data = await this.post("/api/auth/login", { email, password });
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async logout() {
    try {
      await this.post("/api/auth/logout", {});
    } catch {
      // logout even if server call fails
    }
    this.clearTokens();
  }

  async getMe() {
    return this.get("/api/auth/me");
  }

  // ─── Chat Methods ─────────────────────────────────────────────

  async getConversations(limit = 50, offset = 0) {
    return this.get(`/api/chat/conversations?limit=${limit}&offset=${offset}`);
  }

  async getConversation(id) {
    return this.get(`/api/chat/conversations/${id}`);
  }

  async deleteConversation(id) {
    return this.delete(`/api/chat/conversations/${id}`);
  }

  // ─── Bank & Analytics Methods ─────────────────────────────────

  async getBanks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/banks${query ? "?" + query : ""}`);
  }

  async getAnalytics() {
    return this.get("/api/analytics");
  }

  async changePassword(currentPassword, newPassword) {
    const res = await this.request("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    return res.json();
  }
}

const api = new ApiClient();
export default api;
