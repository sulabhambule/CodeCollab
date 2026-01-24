// “After refresh, how do I know who the user is and which room they belong to?”

const SESSION_KEY = "codecollab-session";

/**
 * Save user session in localStorage
 * @param {Object} session
 * @param {string} session.roomId
 * @param {string} session.userName
 * @param {string} [session.language]
 */

export function saveSession({ roomId, userName, language }) {
  if (!roomId || !userName) return;

  const data = { roomId, userName };

  if (language) {
    data.language = language;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/**
 * Get saved session from localStorage
 * @returns {Object|null}
 */

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    console.error("Invalid session data", err);
    return null;
  }
}

/*
clear session
*/

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
