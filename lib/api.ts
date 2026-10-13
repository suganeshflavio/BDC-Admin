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
  Announcement,
  AnnouncementInput,
  AnnouncementsResponse,
  FeedbackQuestion,
  FeedbackQuestionInput,
  FeedbackQuestionsResponse,
  FeedbackAnswer,
  FeedbackAnswersResponse,
  PrayerRequest,
  PrayerRequestsResponse,
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
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function extractErrorMessage(data: unknown, status: number): string {
  if (!data) {
    return getStatusFallbackMessage(status);
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim().slice(0, 300);
  }

  if (typeof data !== 'object') {
    return getStatusFallbackMessage(status);
  }

  const obj = data as Record<string, unknown>;

  // 1. Direct string error
  if (typeof obj.error === 'string' && obj.error.trim()) {
    return obj.error.trim();
  }

  // 2. Direct string message
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }

  // 3. Direct string detail
  if (typeof obj.detail === 'string' && obj.detail.trim()) {
    return obj.detail.trim();
  }

  // 4. Nested error object: { error: { message: "..." } }
  if (obj.error && typeof obj.error === 'object') {
    const errObj = obj.error as Record<string, unknown>;
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return errObj.message.trim();
    }
    if (typeof errObj.detail === 'string' && errObj.detail.trim()) {
      return errObj.detail.trim();
    }
  }

  // 5. errors field: array or object mapping
  if (obj.errors) {
    if (Array.isArray(obj.errors)) {
      const list = obj.errors
        .map((e: unknown) =>
          typeof e === 'string'
            ? e.trim()
            : typeof e === 'object' && e !== null
            ? (e as Record<string, unknown>).message ||
              (e as Record<string, unknown>).detail ||
              JSON.stringify(e)
            : String(e)
        )
        .filter(Boolean);
      if (list.length > 0) return list.join(', ');
    } else if (typeof obj.errors === 'object' && obj.errors !== null) {
      const list = Object.entries(obj.errors as Record<string, unknown>)
        .map(([field, msgs]) => {
          const formattedMsgs = Array.isArray(msgs)
            ? msgs.join(', ')
            : typeof msgs === 'string'
            ? msgs.trim()
            : msgs && typeof msgs === 'object' && 'message' in (msgs as Record<string, unknown>)
            ? String((msgs as Record<string, unknown>).message)
            : String(msgs);
          if (field === 'base' || field === 'error' || field === 'detail') {
            return formattedMsgs;
          }
          const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
          return `${fieldLabel} ${formattedMsgs}`;
        })
        .filter(Boolean);
      if (list.length > 0) return list.join('; ');
    } else if (typeof obj.errors === 'string' && obj.errors.trim()) {
      return obj.errors.trim();
    }
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

    let data: unknown = null;
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
  adminAnnouncements: {
    list: (page = 1) => request<AnnouncementsResponse>(`/announcements?page=${page}`),
    get: (id: number) =>
      request<{ announcement?: Announcement } | Announcement>(`/announcements/${id}`).then((res) =>
        'announcement' in res && res.announcement ? res.announcement : (res as Announcement)
      ),
    create: (announcement: AnnouncementInput) =>
      request<{ announcement?: Announcement } | Announcement>('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ announcement }),
      }).then((res) =>
        'announcement' in res && res.announcement ? res.announcement : (res as Announcement)
      ),
    update: (id: number, announcement: AnnouncementInput) =>
      request<{ announcement?: Announcement } | Announcement>(`/admin/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ announcement }),
      }).then((res) =>
        'announcement' in res && res.announcement ? res.announcement : (res as Announcement)
      ),
    delete: (id: number) =>
      request<void>(`/admin/announcements/${id}`, {
        method: 'DELETE',
      }),
  },
  adminFeedback: {
    listQuestions: async (page = 1): Promise<FeedbackQuestionsResponse> => {
      const res = await request<FeedbackQuestionsResponse | FeedbackQuestion[]>(
        `/admin/feedback_questions?page=${page}`
      );
      if (Array.isArray(res)) {
        return {
          feedback_questions: res,
          meta: { current_page: page, total_pages: 1, total_count: res.length },
        };
      }
      return {
        feedback_questions: res?.feedback_questions || [],
        meta: res?.meta || { current_page: page, total_pages: 1, total_count: (res?.feedback_questions || []).length },
      };
    },
    getQuestion: async (id: number): Promise<FeedbackQuestion> => {
      const res = await request<{ feedback_question?: FeedbackQuestion } | FeedbackQuestion>(
        `/admin/feedback_questions/${id}`
      );
      return 'feedback_question' in res && res.feedback_question ? res.feedback_question : (res as FeedbackQuestion);
    },
    createQuestion: async (feedback_question: FeedbackQuestionInput): Promise<FeedbackQuestion> => {
      const res = await request<{ feedback_question?: FeedbackQuestion } | FeedbackQuestion>(
        '/admin/feedback_questions',
        {
          method: 'POST',
          body: JSON.stringify({ feedback_question }),
        }
      );
      return 'feedback_question' in res && res.feedback_question ? res.feedback_question : (res as FeedbackQuestion);
    },
    updateQuestion: async (id: number, feedback_question: FeedbackQuestionInput): Promise<FeedbackQuestion> => {
      const res = await request<{ feedback_question?: FeedbackQuestion } | FeedbackQuestion>(
        `/admin/feedback_questions/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ feedback_question }),
        }
      );
      return 'feedback_question' in res && res.feedback_question ? res.feedback_question : (res as FeedbackQuestion);
    },
    deleteQuestion: (id: number): Promise<void> =>
      request<void>(`/admin/feedback_questions/${id}`, {
        method: 'DELETE',
      }),
    getQuestionAnswers: async (
      questionId: number,
      page = 1,
      deviceId?: string
    ): Promise<FeedbackAnswersResponse> => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (deviceId && deviceId.trim()) {
        params.set('device_id', deviceId.trim());
      }
      const res = await request<FeedbackAnswersResponse | FeedbackAnswer[]>(
        `/admin/feedback_questions/${questionId}/answers?${params.toString()}`
      );
      if (Array.isArray(res)) {
        return {
          feedback_answers: res,
          meta: { current_page: page, total_pages: 1, total_count: res.length },
        };
      }
      return {
        feedback_answers: res?.feedback_answers || [],
        meta: res?.meta || { current_page: page, total_pages: 1, total_count: (res?.feedback_answers || []).length },
      };
    },
    getAllAnswers: async (page = 1, deviceId?: string): Promise<FeedbackAnswersResponse> => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (deviceId && deviceId.trim()) {
        params.set('device_id', deviceId.trim());
      }
      const res = await request<FeedbackAnswersResponse | FeedbackAnswer[]>(
        `/admin/feedback_answers?${params.toString()}`
      );
      if (Array.isArray(res)) {
        return {
          feedback_answers: res,
          meta: { current_page: page, total_pages: 1, total_count: res.length },
        };
      }
      return {
        feedback_answers: res?.feedback_answers || [],
        meta: res?.meta || { current_page: page, total_pages: 1, total_count: (res?.feedback_answers || []).length },
      };
    },
  },
  adminPrayerRequests: {
    list: async (params?: {
      status?: string;
      device_id?: string;
      page?: number;
    }): Promise<PrayerRequestsResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
      if (params?.device_id && params.device_id.trim()) searchParams.set('device_id', params.device_id.trim());

      const queryStr = searchParams.toString();
      const path = `/admin/prayer_requests${queryStr ? `?${queryStr}` : ''}`;
      const res = await request<PrayerRequestsResponse | PrayerRequest[]>(path);
      if (Array.isArray(res)) {
        return {
          prayer_requests: res,
          meta: { current_page: params?.page || 1, total_pages: 1, total_count: res.length },
        };
      }
      return {
        prayer_requests: res?.prayer_requests || [],
        meta: res?.meta || { current_page: params?.page || 1, total_pages: 1, total_count: (res?.prayer_requests || []).length },
      };
    },
    get: async (id: number): Promise<PrayerRequest> => {
      const res = await request<{ prayer_request?: PrayerRequest } | PrayerRequest>(
        `/admin/prayer_requests/${id}`
      );
      return 'prayer_request' in res && res.prayer_request ? res.prayer_request : (res as PrayerRequest);
    },
    updateStatus: async (id: number, status: string): Promise<PrayerRequest> => {
      const res = await request<{ prayer_request?: PrayerRequest } | PrayerRequest>(
        `/admin/prayer_requests/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ prayer_request: { status } }),
        }
      );
      return 'prayer_request' in res && res.prayer_request ? res.prayer_request : (res as PrayerRequest);
    },
    delete: (id: number): Promise<void> =>
      request<void>(`/admin/prayer_requests/${id}`, {
        method: 'DELETE',
      }),
  },
};

export function parseBannerImage(imgTagOrUrl: string): { url: string; alt: string } {
  if (!imgTagOrUrl) return { url: '', alt: '' };
  const trimmed = imgTagOrUrl.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const altMatch = trimmed.match(/alt=["']([^"']*)["']/i);
  if (srcMatch) {
    return {
      url: srcMatch[1],
      alt: altMatch ? altMatch[1] : '',
    };
  }
  return {
    url: trimmed.replace(/<[^>]+>/g, '').trim(),
    alt: '',
  };
}

export function formatBannerImageTag(url: string, alt = ''): string {
  const cleanUrl = url.trim();
  const cleanAlt = alt.trim();
  if (cleanUrl.startsWith('<img') && cleanUrl.endsWith('/>')) {
    return cleanUrl;
  }
  return `<img src="${cleanUrl}" alt="${cleanAlt || 'Banner'}" />`;
}
