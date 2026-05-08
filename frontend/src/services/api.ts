import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// process.env.EXPO_PUBLIC_* is statically inlined by Babel at build time.
// Do NOT access via globalThis.process — it won't be inlined.
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

const PRODUCTION_API_URL = 'https://yoice.duckdns.org/api';

const getExpoHost = () => {
  const constantsAny = Constants as any;
  const candidates = [
    constantsAny.expoConfig?.hostUri,
    constantsAny.manifest2?.extra?.expoGo?.debuggerHost,
    constantsAny.manifest?.debuggerHost,
    constantsAny.expoGoConfig?.debuggerHost
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate.split(':')[0];
    }
  }

  return null;
};

const detectedHost = getExpoHost();
const normalizeNativeEnvApiUrl = (value?: string) => {
  if (!value || Platform.OS === 'web' || !detectedHost) {
    return value;
  }

  // On physical devices, localhost/127.0.0.1 points to the phone, not the dev machine.
  return value
    .replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, (_fullMatch, _host, port) => `http://${detectedHost}${port ?? ''}`)
    .replace(/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, (_fullMatch, _host, port) => `https://${detectedHost}${port ?? ''}`);
};

const normalizedEnvApiUrl = normalizeNativeEnvApiUrl(envApiUrl);

const apiBaseUrl = normalizedEnvApiUrl
  || (Platform.OS === 'web' ? '/api' : (detectedHost ? `http://${detectedHost}:3001/api` : PRODUCTION_API_URL));

console.log('[api] envApiUrl:', envApiUrl);
console.log('[api] normalizedEnvApiUrl:', normalizedEnvApiUrl);
console.log('[api] baseURL:', apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
});

const authHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

export type PollResponse = {
  id: string;
  currentUserId: string;
  question: string;
  questionMeta: {
    id: string;
    category: string;
    selectionType: string;
    nsfw: boolean;
    active: boolean;
  };
  options: Array<{
    id: string;
    userId: string;
    label: string;
    user: {
      id: string;
      name: string | null;
      avatarColor: string | null;
      avatarImage: string | null;
    };
  }>;
  expiresAt: string | null;
  createdAt: string;
  expired: boolean;
  userVote: {
    id: string;
    optionId: string;
    createdAt: string;
  } | null;
  results: Array<{
    optionId: string;
    label: string;
    userId: string;
    avatarColor: string | null;
    avatarImage: string | null;
    votes: number;
    voters: Array<{
      id: string;
      name: string;
      avatarColor: string | null;
      avatarImage: string | null;
    }>;
  }>;
};

export type AccessResponse = {
  nextStep: 'groupList' | 'onboarding';
  token: string;
  user: {
    id: string;
    authKey: string | null;
    email: string | null;
    name: string | null;
    avatarColor: string | null;
    avatarImage: string | null;
    createdAt: string;
  };
  groups: Array<{
    id: string;
    name: string;
    inviteCode: string;
  }>;
  pollId: string | null;
};

export type EmailLoginStartResponse = {
  ok: boolean;
  message: string;
  debugLoginUrl?: string;
  directLogin?: boolean;
  token?: string;
  pollId?: string | null;
  user?: {
    id: string;
    authKey: string | null;
    email: string | null;
    name: string | null;
    avatarColor: string | null;
    avatarImage: string | null;
    createdAt: string;
  };
};

export type UserProfileResponse = {
  id: string;
  authKey: string | null;
  email: string | null;
  name: string | null;
  avatarColor: string | null;
  avatarImage: string | null;
  createdAt: string;
};

export type MagicLinkVerifyResponse = {
  token: string;
  pollId: string | null;
  user: {
    id: string;
    authKey: string | null;
    email: string | null;
    name: string | null;
    avatarColor: string | null;
    avatarImage: string | null;
    createdAt: string;
  };
};

export type GroupAccessResponse = {
  group: {
    id: string;
    name: string;
    inviteCode: string;
  };
  poll: {
    id: string;
  } | null;
  memberCount: number;
  pollReady: boolean;
};

export type GroupSummary = {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  pollReady: boolean;
  poll: {
    id: string;
  } | null;
};

export type GroupListResponse = {
  groups: GroupSummary[];
};

export type RegisterPayload = {
  name: string;
  age: number;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type GenericMessageResponse = {
  ok?: boolean;
  message: string;
};

export default {
  register: (payload: RegisterPayload) =>
    api.post<AccessResponse>('/auth/register', payload),
  loginWithPassword: (payload: LoginPayload) =>
    api.post<AccessResponse>('/auth/login', payload),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<GenericMessageResponse>('/auth/password/forgot', payload),
  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<GenericMessageResponse>('/auth/password/reset', payload),
  authenticateAutologin: (token: string, pollId?: string) =>
    api.get<AccessResponse>('/auth/autologin', {
      params: { token, ...(pollId ? { pollId } : {}) }
    }),
  verifyMagicLink: (token: string) =>
    api.post<MagicLinkVerifyResponse>('/auth/magic-link/verify', { token }),
  startEmailLogin: (payload: { email: string; pollId?: string }) =>
    api.post<EmailLoginStartResponse>('/auth/email/start', payload),
  getMe: (token: string) => api.get<UserProfileResponse>('/user/me', authHeaders(token)),
  saveUserName: (token: string, name: string) =>
    api.post('/user/name', { name }, authHeaders(token)),
  saveUserProfile: (token: string, payload: { name: string; avatarColor: string; avatarImage?: string | null }) =>
    api.post<UserProfileResponse>('/user/profile', payload, authHeaders(token)),
  createGroup: (token: string, name: string) =>
    api.post<GroupAccessResponse>('/groups', { name }, authHeaders(token)),
  listGroups: (token: string) => api.get<GroupListResponse>('/groups', authHeaders(token)),
  joinGroup: (token: string, inviteCode: string) =>
    api.post<GroupAccessResponse>('/groups/join', { inviteCode }, authHeaders(token)),
  getPoll: (token: string, pollId: string) =>
    api.get<PollResponse>(`/polls/${pollId}`, authHeaders(token)),
  submitVote: (token: string, pollId: string, optionId: string) =>
    api.post('/votes', { pollId, optionId }, authHeaders(token))
};
