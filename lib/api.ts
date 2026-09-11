import {
  AuthResponse,
  Song,
  SongInput,
  SongsResponse,
  NotificationItem,
  NotificationInput,
  NotificationsResponse,
  AboutUs,
  AboutUsInput,
  RegisterUserInput,
  RegisterUserResponse,
  UsersResponse,
} from './types';

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_API_BASE_URL ||
  '';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('church_admin_api_base');
    if (saved) {
      if (saved.includes('192.168.') || saved.includes('localhost')) {
        localStorage.removeItem('church_admin_api_base');
      } else if (saved.trim() !== '') {
        return saved.trim();
      }
    }
  }
  return DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('church_admin_api_base', url.trim());
  }
}

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('church_admin_token');
  }
  return null;
}

export function setStoredToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('church_admin_token', token);
    } else {
      localStorage.removeItem('church_admin_token');
    }
  }
}

export function isDemoModeEnabled(): boolean {
  return false;
}

export function setDemoModeEnabled(_enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('church_admin_demo_mode');
  }
}

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function extractErrorMessage(data: any, status: number): string {
  if (!data) {
    return getStatusFallbackMessage(status);
  }

  // 1. Direct string error
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  // 2. Direct string message
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  // 3. Direct string detail
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail.trim();
  }

  // 4. Nested error object: { error: { message: "..." } }
  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.message === 'string' && data.error.message.trim()) {
      return data.error.message.trim();
    }
    if (typeof data.error.detail === 'string' && data.error.detail.trim()) {
      return data.error.detail.trim();
    }
  }

  // 5. errors field: array or object mapping
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      const list = data.errors
        .map((e: any) =>
          typeof e === 'string'
            ? e.trim()
            : typeof e === 'object' && e !== null
            ? e.message || e.detail || JSON.stringify(e)
            : String(e)
        )
        .filter(Boolean);
      if (list.length > 0) return list.join(', ');
    } else if (typeof data.errors === 'object' && data.errors !== null) {
      const list = Object.entries(data.errors)
        .map(([field, msgs]) => {
          const formattedMsgs = Array.isArray(msgs)
            ? msgs.join(', ')
            : typeof msgs === 'string'
            ? msgs.trim()
            : msgs && typeof msgs === 'object' && 'message' in (msgs as any)
            ? (msgs as any).message
            : String(msgs);
          if (field === 'base' || field === 'error' || field === 'detail') {
            return formattedMsgs;
          }
          const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
          return `${fieldLabel} ${formattedMsgs}`;
        })
        .filter(Boolean);
      if (list.length > 0) return list.join('; ');
    } else if (typeof data.errors === 'string' && data.errors.trim()) {
      return data.errors.trim();
    }
  }

  // 6. If data itself is a string
  if (typeof data === 'string' && data.trim()) {
    return data.trim().slice(0, 300);
  }

  return getStatusFallbackMessage(status);
}

function getStatusFallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please check submitted data.';
    case 401:
      return 'Invalid credentials or unauthorized request.';
    case 403:
      return 'Access denied. Administrator privileges required.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict: Record already exists.';
    case 422:
      return 'Validation failed. Please check the input fields.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway: Unable to connect to backend server.';
    case 503:
      return 'Service unavailable. Backend server is currently unreachable.';
    default:
      return `Request failed with status ${status}`;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 204) {
      return {} as T;
    }

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => '');
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
          data = { error: cleanText ? cleanText.slice(0, 250) : undefined };
        }
      }
    }

    if (!res.ok) {
      const errorMsg = extractErrorMessage(data, res.status);

      // Only dispatch unauthorized event for protected endpoints when an active token was provided.
      // NEVER dispatch during login, registration, or when unauthenticated!
      const isAuthEndpoint = path.startsWith('/auth/');
      if (res.status === 401 && !isAuthEndpoint && token && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('church-auth-unauthorized'));
      }

      throw new ApiError(errorMsg, res.status, data);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    console.error(`[API] Error communicating with ${baseUrl}${path}:`, err);
    const networkMsg = err instanceof Error ? err.message : String(err);
    const isNetworkError =
      networkMsg.includes('Failed to fetch') ||
      networkMsg.includes('NetworkError') ||
      networkMsg.includes('fetch failed');
    throw new ApiError(
      isNetworkError
        ? `Unable to reach server at ${baseUrl || 'backend'}. Please check your connection.`
        : networkMsg || `Unable to reach server at ${baseUrl}.`,
      503
    );
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (userInput: RegisterUserInput) =>
      request<RegisterUserResponse>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ user: userInput }),
      }),
  },
  adminUsers: {
    list: (page = 1) => request<UsersResponse>(`/admin/users?page=${page}`),
    create: (userInput: RegisterUserInput) =>
      request<RegisterUserResponse>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ user: userInput }),
      }),
  },
  adminSongs: {
    list: (page = 1) => request<SongsResponse>(`/admin/songs?page=${page}`),
    get: (id: number) => request<Song>(`/admin/songs/${id}`),
    create: (song: SongInput) =>
      request<Song>('/admin/songs', {
        method: 'POST',
        body: JSON.stringify({ song }),
      }),
    update: (id: number, song: SongInput) =>
      request<Song>(`/admin/songs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ song }),
      }),
    delete: (id: number) =>
      request<void>(`/admin/songs/${id}`, {
        method: 'DELETE',
      }),
  },
  adminNotifications: {
    list: (page = 1) => request<NotificationsResponse>(`/admin/notifications?page=${page}`),
    get: (id: number) => request<NotificationItem>(`/admin/notifications/${id}`),
    create: (notification: NotificationInput) =>
      request<NotificationItem>('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ notification }),
      }),
    update: (id: number, notification: NotificationInput) =>
      request<NotificationItem>(`/admin/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ notification }),
      }),
    delete: (id: number) =>
      request<void>(`/admin/notifications/${id}`, {
        method: 'DELETE',
      }),
  },
  aboutUs: {
    get: () => request<AboutUs>('/about_us'),
    update: (about_us: AboutUsInput) =>
      request<AboutUs>('/admin/about_us', {
        method: 'PUT',
        body: JSON.stringify({ about_us }),
      }),
  },
};
