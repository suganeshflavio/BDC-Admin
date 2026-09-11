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
  User,
  UsersResponse,
} from './types';

const DEFAULT_API_BASE_URL = process.env.NEXT_API_BASE_URL || 'http://192.168.1.39:3099/api/v1';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('church_admin_api_base');
    if (saved && saved !== 'http://localhost:3000/api/v1') return saved;
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
  if (typeof window !== 'undefined') {
    const val = localStorage.getItem('church_admin_demo_mode');
    return val === 'true';
  }
  return false;
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('church_admin_demo_mode', enabled ? 'true' : 'false');
  }
}

// In-memory collections (empty by default - live data fetched from backend)
let mockSongs: Song[] = [];
let mockNotifications: NotificationItem[] = [];
let mockAboutUs: AboutUs = {
  church_name: '',
  ministry_name: '',
  description: '',
  contact_number: '',
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isDemo = isDemoModeEnabled();
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

  // Handle Mock/Demo mode directly
  if (isDemo) {
    return handleMockRequest<T>(path, options);
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMsg = data?.error;
      if (!errorMsg && data?.errors) {
        if (Array.isArray(data.errors)) {
          errorMsg = data.errors.join(', ');
        } else if (typeof data.errors === 'object') {
          errorMsg = Object.entries(data.errors)
            .map(([field, msgs]) => `${field} ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
        } else {
          errorMsg = String(data.errors);
        }
      }
      if (!errorMsg) {
        errorMsg = `Request failed with status ${res.status}`;
      }
      if (res.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('church-auth-unauthorized'));
      }
      throw new ApiError(errorMsg, res.status);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Only fall back to Mock mode if explicitly enabled
    if (!isDemo) {
      console.error(`[API] Error communicating with ${baseUrl}${path}:`, err);
      throw new ApiError(
        `Unable to reach server at ${baseUrl}. Please check server connection.`,
        503
      );
    }
    return handleMockRequest<T>(path, options);
  }
}

function handleMockRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : null;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. Auth Register (GET users list)
      if (path.startsWith('/admin/users') && method === 'GET') {
        const res: UsersResponse = {
          users: [],
          meta: {
            current_page: 1,
            total_pages: 1,
            total_count: 0,
          },
        };
        resolve(res as unknown as T);
        return;
      }
      // 1. Auth Login
      if (path === '/auth/login' && method === 'POST') {
        if (body?.email && body?.password) {
          const authData: AuthResponse = {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token_admin_authorized',
            user: {
              id: 12,
              name: 'Grace (Admin)',
              email: body.email,
              phone: '9876543210',
              role: 'admin',
            },
          };
          resolve(authData as unknown as T);
        } else {
          reject(new ApiError('Invalid email or password', 401));
        }
        return;
      }

      // 1b. Auth Register (No Auth required)
      if (path === '/admin/users' && method === 'POST') {
        const u = body?.user;
        if (!u?.email || !u?.name || !u?.password) {
          reject(new ApiError('Name, email, and password are required', 422));
          return;
        }
        if (u.password.length < 6) {
          reject(new ApiError('Password must be at least 6 characters', 422));
          return;
        }
        const newUser: User = {
          id: Math.floor(Math.random() * 9000) + 100,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: 'user',
        };
        const registerData: RegisterUserResponse = {
          token: `eyJhbGciOiJIUzI1NiJ9.demo_token_user_${newUser.id}`,
          user: newUser,
        };
        resolve(registerData as unknown as T);
        return;
      }

      // 2. Admin Songs
      if (path.startsWith('/admin/songs')) {
        if (method === 'GET') {
          if (path.includes('?') || path === '/admin/songs') {
            const res: SongsResponse = {
              songs: [...mockSongs],
              meta: {
                current_page: 1,
                total_pages: 1,
                total_count: mockSongs.length,
              },
            };
            resolve(res as unknown as T);
            return;
          } else {
            const id = parseInt(path.split('/')[3], 10);
            const found = mockSongs.find((s) => s.id === id);
            if (found) {
              resolve(found as unknown as T);
            } else {
              reject(new ApiError('Record not found', 404));
            }
            return;
          }
        }

        if (method === 'POST') {
          const input = body?.song as SongInput;
          const newId = Date.now();
          const verses = (input.song_verses_attributes || [])
            .filter((v) => !v._destroy)
            .map((v, idx) => ({
              id: v.id || Date.now() + idx,
              verse_type: v.verse_type,
              verse_number: v.verse_number ?? null,
              position: v.position ?? idx,
              content: v.content || '',
            }));

          const createdSong: Song = {
            id: newId,
            song_number: Number(input.song_number),
            title: input.title,
            title_thanglish: input.title_thanglish,
            published: input.published ?? true,
            song_verses: verses,
            favorites_count: 0,
          };
          mockSongs.unshift(createdSong);
          resolve(createdSong as unknown as T);
          return;
        }

        if (method === 'PUT') {
          const id = parseInt(path.split('/')[3], 10);
          const idx = mockSongs.findIndex((s) => s.id === id);
          if (idx === -1) {
            reject(new ApiError('Record not found', 404));
            return;
          }
          const input = body?.song as SongInput;
          const existing = mockSongs[idx];
          const currentVerses = [...(existing.song_verses || [])];

          // Apply verses modifications
          if (input.song_verses_attributes) {
            input.song_verses_attributes.forEach((attr, attrIdx) => {
              if (attr._destroy && attr.id) {
                const removeIdx = currentVerses.findIndex((v) => v.id === attr.id);
                if (removeIdx !== -1) currentVerses.splice(removeIdx, 1);
              } else if (attr.id) {
                const existVIdx = currentVerses.findIndex((v) => v.id === attr.id);
                if (existVIdx !== -1) {
                  currentVerses[existVIdx] = {
                    ...currentVerses[existVIdx],
                    verse_type: attr.verse_type,
                    verse_number: attr.verse_number ?? null,
                    position: attr.position ?? currentVerses[existVIdx].position,
                    content: attr.content ?? currentVerses[existVIdx].content,
                  };
                }
              } else {
                currentVerses.push({
                  id: Date.now() + attrIdx,
                  verse_type: attr.verse_type,
                  verse_number: attr.verse_number ?? null,
                  position: attr.position ?? currentVerses.length,
                  content: attr.content || '',
                });
              }
            });
          }

          const updated: Song = {
            ...existing,
            song_number: Number(input.song_number ?? existing.song_number),
            title: input.title ?? existing.title,
            title_thanglish: input.title_thanglish ?? existing.title_thanglish,
            published: input.published !== undefined ? input.published : existing.published,
            song_verses: currentVerses,
          };
          mockSongs[idx] = updated;
          resolve(updated as unknown as T);
          return;
        }

        if (method === 'DELETE') {
          const id = parseInt(path.split('/')[3], 10);
          mockSongs = mockSongs.filter((s) => s.id !== id);
          resolve({} as unknown as T);
          return;
        }
      }

      // 3. Admin Notifications
      if (path.startsWith('/admin/notifications')) {
        if (method === 'GET') {
          if (path.includes('?') || path === '/admin/notifications') {
            const res: NotificationsResponse = {
              notifications: [...mockNotifications],
              unread_count: 2,
              meta: {
                current_page: 1,
                total_pages: 1,
                total_count: mockNotifications.length,
              },
            };
            resolve(res as unknown as T);
            return;
          } else {
            const id = parseInt(path.split('/')[3], 10);
            const found = mockNotifications.find((n) => n.id === id);
            if (found) {
              resolve(found as unknown as T);
            } else {
              reject(new ApiError('Record not found', 404));
            }
            return;
          }
        }

        if (method === 'POST') {
          const input = body?.notification as NotificationInput;
          const newNotif: NotificationItem = {
            id: Date.now(),
            title: input.title,
            preacher_name: input.preacher_name,
            description: input.description,
            scripture_text: input.scripture_text,
            youtube_url: input.youtube_url,
            notification_date: input.notification_date || new Date().toISOString().split('T')[0],
            created_by: 12,
          };
          mockNotifications.unshift(newNotif);
          resolve(newNotif as unknown as T);
          return;
        }

        if (method === 'PUT') {
          const id = parseInt(path.split('/')[3], 10);
          const idx = mockNotifications.findIndex((n) => n.id === id);
          if (idx === -1) {
            reject(new ApiError('Record not found', 404));
            return;
          }
          const input = body?.notification as NotificationInput;
          const updated: NotificationItem = {
            ...mockNotifications[idx],
            title: input.title,
            preacher_name: input.preacher_name,
            description: input.description,
            scripture_text: input.scripture_text,
            youtube_url: input.youtube_url,
            notification_date: input.notification_date,
          };
          mockNotifications[idx] = updated;
          resolve(updated as unknown as T);
          return;
        }

        if (method === 'DELETE') {
          const id = parseInt(path.split('/')[3], 10);
          mockNotifications = mockNotifications.filter((n) => n.id !== id);
          resolve({} as unknown as T);
          return;
        }
      }

      // 4. About Us
      if (path === '/about_us' && method === 'GET') {
        resolve(mockAboutUs as unknown as T);
        return;
      }

      if (path === '/admin/about_us' && method === 'PUT') {
        const input = body?.about_us as AboutUsInput;
        mockAboutUs = {
          ...mockAboutUs,
          church_name: input.church_name,
          ministry_name: input.ministry_name,
          description: input.description,
          contact_number: input.contact_number,
        };
        resolve(mockAboutUs as unknown as T);
        return;
      }

      reject(new ApiError(`Endpoint not handled: ${method} ${path}`, 404));
    }, 250);
  });
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
