import { supabase } from './supabaseClient';

const API_BASE = import.meta.env.VITE_AI_AGENT_API_URL ?? '/api/agent';

async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.access_token) {
    throw new Error('Не авторизован');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `Ошибка API (${res.status})`);
  }

  return data;
}

export async function initAgentThread() {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    headers,
  });

  return parseResponse(res);
}

export async function sendAgentMessage(threadId, message, userId) {
  if (!threadId) throw new Error('threadId обязателен');
  if (!message?.trim()) throw new Error('Сообщение не может быть пустым');
  if (!userId) throw new Error('userId обязателен');

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE}/threads/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: message.trim(), userId }),
  });

  return parseResponse(res);
}

export async function closeAgentThread(threadId) {
  if (!threadId) return;

  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE}/threads/${encodeURIComponent(threadId)}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 204) return;
  await parseResponse(res);
}
