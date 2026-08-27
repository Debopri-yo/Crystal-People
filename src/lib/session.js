const KEY = 'crystal_people_session';

export function saveSession(user) {
  sessionStorage.setItem(KEY, JSON.stringify(user));
}

export function getSession() {
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
