export type UserRole = 'author' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  role: UserRole;
  author_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Book {
  id: string;
  author_id: string;
  title: string;
  isbn?: string;
  genre?: string;
  publication_date?: string | null;
  status: string;
  mrp?: number | null;
  author_royalty_per_copy?: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date?: string | null;
  print_partner?: string | null;
  available_on?: string[];
  created_at?: string;
  updated_at?: string;
}

export type TicketCategory =
  | 'Royalty & Payments'
  | 'ISBN & Metadata Issues'
  | 'Printing & Quality'
  | 'Distribution & Availability'
  | 'Book Status & Production Updates'
  | 'General Inquiry';

export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type MessageVisibility = 'public' | 'internal';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'author' | 'admin';
  message: string;
  visibility: MessageVisibility;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
  };
}

export interface Ticket {
  id: string;
  ticket_number: string;
  author_id: string;
  book_id?: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  ai_category?: string;
  priority: TicketPriority;
  ai_priority?: string;
  ai_reason?: string;
  ai_confidence?: number;
  ai_status: 'pending' | 'processing' | 'completed' | 'failed' | 'fallback';
  status: TicketStatus;
  assigned_admin_id?: string | null;
  admin_override: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  author?: {
    full_name: string;
    email: string;
  };
  book?: {
    title: string;
    isbn?: string;
  };
  assigned_admin?: {
    full_name: string;
    email: string;
  };
  messages?: TicketMessage[];
}

export interface AuthorDashboardStats {
  total_books: number;
  published_books: number;
  in_production_books: number;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  recent_tickets: Ticket[];
  recent_books: Book[];
}

export interface AdminDashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  critical_tickets: number;
  high_priority_tickets: number;
  awaiting_admin: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  recent_tickets: Ticket[];
}

export interface RAGExcerpt {
  id: string;
  title: string;
  category: string;
  content: string;
  score: number;
  source: string;
}

export interface AIDraftResponse {
  draft_response: string;
  retrieved_excerpts: RAGExcerpt[];
  model_used: string;
  status: string;
}
