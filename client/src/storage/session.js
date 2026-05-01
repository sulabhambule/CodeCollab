import { v4 as uuid } from "uuid";

const SESSION_KEY = "codecollab-session";

/**
 * Save user session in localStorage
 */
export function saveSession({ roomId, userName, language, userId }) {
  if (!roomId || !userName) return;

  const data = { roomId, userName, userId };

  if (language) {
    data.language = language;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Generate or get userId
 */
function getOrCreateUserId() {
  let userId = localStorage.getItem("userId");

  if (!userId) {
    userId = uuid(); // ✅ FIXED
    localStorage.setItem("userId", userId);
  }

  return userId;
}

/**
 * Get saved session
 */
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    // Ensure userId always exists
    if (!session.userId) {
      session.userId = getOrCreateUserId();
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return session;
  } catch (err) {
    console.error("Invalid session data", err);
    return null;
  }
}

/**
 * Clear session
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}