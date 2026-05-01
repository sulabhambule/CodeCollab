// “After refresh, how do I know who the user is and which room they belong to?”

const SESSION_KEY = "codecollab-session";

/**
 * Save user session in localStorage
 * @param {Object} session
 * @param {string} session.roomId
 * @param {string} session.userName
 * @param {string} [session.language]
 */

export function saveSession({ roomId, userName, language, userId }) {
  if (!roomId || !userName) return;

  const data = { roomId, userName, userId };

  if (language) {
    data.language = language;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}


function getOrCreateUserId() {
  let userId = localStorage.getItem("userId");

  if (!userId) {
    // we need to create the new userId
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
  }
  return userId;
}


/**
 * Get saved session from localStorage
 * @returns {Object|null}
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

/*
clear session
*/

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
