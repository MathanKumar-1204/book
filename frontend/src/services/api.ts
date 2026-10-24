import {
  UserProfile,
  Book,
  Ticket,
  TicketMessage,
  AuthorDashboardStats,
  AdminDashboardStats,
  AIDraftResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('bookleaf_token', token);
    } else {
      localStorage.removeItem('bookleaf_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('bookleaf_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data?.data !== undefined ? data.data : data;
    } catch (err: any) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth Endpoints
  async register(fullName: string, email: string, pass: string): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password: pass }),
    });
  }

  async login(email: string, pass: string): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
  }

  // Author Endpoints
  async getCurrentUser(): Promise<UserProfile> {
    return this.request<UserProfile>('/me');
  }

  async getAuthorDashboard(): Promise<AuthorDashboardStats> {
    return this.request<AuthorDashboardStats>('/me/dashboard');
  }

  async getAuthorBooks(): Promise<Book[]> {
    return this.request<Book[]>('/me/books');
  }

  async getAuthorBook(bookId: string): Promise<Book & { tickets: Ticket[] }> {
    return this.request<Book & { tickets: Ticket[] }>(`/me/books/${bookId}`);
  }

  async getAuthorTickets(params?: { status?: string; category?: string; search?: string; sort_by?: string }): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Ticket[]>(`/me/tickets${qs}`);
  }

  async createAuthorTicket(payload: { subject: string; description: string; book_id?: string | null }): Promise<Ticket> {
    return this.request<Ticket>('/me/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async clarifyTicketInquiry(message: string, bookId?: string | null, history?: Array<{ sender: string; text: string }>): Promise<{ success: boolean; response: string }> {
    return this.request<{ success: boolean; response: string }>('/me/ai-clarify', {
      method: 'POST',
      body: JSON.stringify({ message, book_id: bookId, history }),
    });
  }

  async getAuthorTicket(ticketId: string): Promise<Ticket & { messages: TicketMessage[] }> {
    return this.request<Ticket & { messages: TicketMessage[] }>(`/me/tickets/${ticketId}`);
  }

  async sendAuthorMessage(ticketId: string, message: string): Promise<TicketMessage> {
    return this.request<TicketMessage>(`/me/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Admin Endpoints
  async getAdminDashboard(): Promise<AdminDashboardStats> {
    return this.request<AdminDashboardStats>('/admin/dashboard');
  }

  async getAdminTickets(params?: { status?: string; category?: string; priority?: string; search?: string; sort_by?: string }): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Ticket[]>(`/admin/tickets${qs}`);
  }

  async getAdminTicket(ticketId: string): Promise<Ticket & { messages: TicketMessage[] }> {
    return this.request<Ticket & { messages: TicketMessage[] }>(`/admin/tickets/${ticketId}`);
  }

  async updateAdminTicket(ticketId: string, updates: { status?: string; category?: string; priority?: string; assigned_admin_id?: string }): Promise<Ticket> {
    return this.request<Ticket>(`/admin/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async assignAdminTicket(ticketId: string, adminId: string): Promise<Ticket> {
    return this.request<Ticket>(`/admin/tickets/${ticketId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ admin_id: adminId }),
    });
  }

  async sendAdminReply(ticketId: string, message: string, status?: string): Promise<TicketMessage> {
    return this.request<TicketMessage>(`/admin/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, status }),
    });
  }

  async addAdminNote(ticketId: string, message: string): Promise<TicketMessage> {
    return this.request<TicketMessage>(`/admin/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async reclassifyTicket(ticketId: string): Promise<{ data: Ticket; ai_result: any }> {
    return this.request<{ data: Ticket; ai_result: any }>(`/admin/tickets/${ticketId}/ai-classify`, {
      method: 'POST',
    });
  }

  async generateAIDraft(ticketId: string): Promise<AIDraftResponse> {
    return this.request<AIDraftResponse>(`/admin/tickets/${ticketId}/ai-draft`, {
      method: 'POST',
    });
  }

  async getAdminAuthors(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/admin/authors');
  }

  async getAdminUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/admin/admin-users');
  }
}

export const api = new ApiService();
