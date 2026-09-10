export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole | string;
  active?: boolean;
  created_at?: string;
}

export interface UsersResponse {
  users: User[];
  meta: PaginationMeta;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterUserPayload {
  user: RegisterUserInput;
}

export interface RegisterUserResponse {
  token?: string;
  user: User;
}

export type VerseType = 'intro' | 'chorus' | 'verse' | 'bridge' | 'outro';

export interface SongVerse {
  id?: number;
  verse_type: VerseType;
  verse_number?: number | null;
  position: number;
  content: string;
  _destroy?: boolean;
}

export interface Song {
  id: number;
  song_number: number;
  title: string;
  title_thanglish: string;
  published: boolean;
  song_verses?: SongVerse[];
  favorites_count?: number;
}

export interface SongInput {
  song_number: number;
  title: string;
  title_thanglish: string;
  published: boolean;
  song_verses_attributes: Array<{
    id?: number;
    verse_type: VerseType;
    verse_number?: number | null;
    position: number;
    content?: string;
    _destroy?: boolean;
  }>;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
}

export interface SongsResponse {
  songs: Song[];
  meta: PaginationMeta;
}

export interface NotificationItem {
  id: number;
  title: string;
  preacher_name: string;
  description?: string | null;
  scripture_text: string;
  youtube_url?: string | null;
  notification_date: string;
  created_by?: number;
  is_read?: boolean;
}

export interface NotificationInput {
  title: string;
  preacher_name: string;
  description?: string | null;
  scripture_text: string;
  youtube_url?: string | null;
  notification_date: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread_count?: number;
  meta: PaginationMeta;
}

export interface AboutUs {
  id?: number;
  church_name: string;
  ministry_name: string;
  description: string;
  contact_number: string;
}

export interface AboutUsInput {
  church_name: string;
  ministry_name: string;
  description: string;
  contact_number: string;
}

export interface ApiError {
  error: string;
}
