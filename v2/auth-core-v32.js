/*
 * 天書三式會員系統 v3.2
 * 純瀏覽器 Fetch 版：不依賴 jsDelivr、不依賴 supabase-js、不使用 getSession()。
 * 認證直接呼叫 Supabase Auth REST API；資料存取使用使用者 JWT + RLS。
 */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://qxcyilkzaayqrbcngrel.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_B1OWmPm6gpKA1Kf8Oywkpg_bBc0M53E';
  const STORAGE_KEY = 'tianshu_auth_v32';
  const REQUEST_TIMEOUT = 15000;

  function parseJsonSafe(text) {
    try { return text ? JSON.parse(text) : null; } catch (_) { return null; }
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT);
    const headers = {
      apikey: SUPABASE_KEY,
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${SUPABASE_URL}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        cache: 'no-store'
      });
      const text = await response.text();
      const data = parseJsonSafe(text);
      if (!response.ok) {
        const message = data?.msg || data?.message || data?.error_description || data?.error || `HTTP ${response.status}`;
        const error = new Error(String(message));
        error.status = response.status;
        error.payload = data;
        throw error;
      }
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('連線逾時，請確認網路後再試。');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function normalizeSession(data, fallbackRefreshToken = '') {
    if (!data?.access_token) throw new Error('登入伺服器沒有回傳 access token。');
    const expiresIn = Number(data.expires_in || 3600);
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || fallbackRefreshToken || '',
      token_type: data.token_type || 'bearer',
      expires_at: Date.now() + Math.max(30, expiresIn - 20) * 1000,
      user: data.user || null
    };
  }

  function saveSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function readSessionRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const value = raw ? JSON.parse(raw) : null;
      return value?.access_token ? value : null;
    } catch (_) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function getUser(accessToken) {
    return request('/auth/v1/user', { token: accessToken });
  }

  async function refreshSession(session) {
    if (!session?.refresh_token) {
      clearSession();
      return null;
    }
    const data = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token }
    });
    const next = normalizeSession(data, session.refresh_token);
    if (!next.user) next.user = session.user || await getUser(next.access_token);
    return saveSession(next);
  }

  async function getSession() {
    let session = readSessionRaw();
    if (!session) return null;
    if (!session.user) {
      try {
        session.user = await getUser(session.access_token);
        saveSession(session);
      } catch (_) {
        try { return await refreshSession(session); } catch (_) { clearSession(); return null; }
      }
    }
    if (Number(session.expires_at || 0) <= Date.now() + 30000) {
      try { session = await refreshSession(session); }
      catch (_) { clearSession(); return null; }
    }
    return session;
  }

  async function signIn(email, password) {
    const data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email, password }
    });
    return saveSession(normalizeSession(data));
  }

  async function signUp({ email, password, displayName, redirectTo }) {
    const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
    const data = await request(`/auth/v1/signup${query}`, {
      method: 'POST',
      body: { email, password, data: { display_name: displayName || '' } }
    });
    if (data?.access_token) saveSession(normalizeSession(data));
    return data;
  }

  async function signOut() {
    const session = readSessionRaw();
    if (session?.access_token) {
      try { await request('/auth/v1/logout?scope=local', { method: 'POST', token: session.access_token }); }
      catch (_) {}
    }
    clearSession();
  }

  async function getOwnProfile(session) {
    if (!session?.user?.id) throw new Error('會員 Session 缺少 user id。');
    const id = encodeURIComponent(session.user.id);
    const select = 'id,email,display_name,role,status,plan,starts_at,expires_at,created_at,updated_at';
    const data = await request(`/rest/v1/profiles?select=${select}&id=eq.${id}&limit=1`, { token: session.access_token });
    if (!Array.isArray(data) || !data[0]) throw new Error('找不到此會員的 profiles 資料。');
    return data[0];
  }

  async function listProfiles(session) {
    const select = 'id,email,display_name,role,status,plan,starts_at,expires_at,created_at,updated_at';
    const data = await request(`/rest/v1/profiles?select=${select}&order=created_at.desc`, { token: session.access_token });
    return Array.isArray(data) ? data : [];
  }

  async function updateProfile(session, id, payload) {
    const encoded = encodeURIComponent(id);
    await request(`/rest/v1/profiles?id=eq.${encoded}`, {
      method: 'PATCH',
      token: session.access_token,
      headers: { Prefer: 'return=minimal' },
      body: payload
    });
  }

  async function captureSessionFromUrl() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    if (!accessToken) return getSession();
    const refreshToken = hash.get('refresh_token') || '';
    const expiresIn = Number(hash.get('expires_in') || 3600);
    const user = await getUser(accessToken);
    const session = saveSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: hash.get('token_type') || 'bearer',
      expires_at: Date.now() + Math.max(30, expiresIn - 20) * 1000,
      user
    });
    history.replaceState(null, '', location.pathname + location.search);
    return session;
  }

  window.TianShuAuth = Object.freeze({
    SUPABASE_URL,
    SUPABASE_KEY,
    STORAGE_KEY,
    signIn,
    signUp,
    signOut,
    getSession,
    getOwnProfile,
    listProfiles,
    updateProfile,
    captureSessionFromUrl,
    clearSession
  });
})();
