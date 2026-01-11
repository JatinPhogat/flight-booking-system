export const apiBase = import.meta.env.VITE_API_URL || '/api';

export function ensureUserId() {
  let id = localStorage.getItem('x-user-id');
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('x-user-id', id);
  }
  return id;
}

export function withUserHeaders(userId) {
  return { 'Content-Type': 'application/json', 'x-user-id': userId };
}
