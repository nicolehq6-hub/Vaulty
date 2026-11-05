(() => {
  "use strict";

  const accountsKey = "vaultly-local-accounts";
  const sessionKey = "vaultly-local-session";
  const iterations = 310000;

  const storage = () => {
    try {
      return window.localStorage;
    } catch (error) {
      throw new Error("Browser storage is unavailable. Enable storage for this site and try again.");
    }
  };

  const readAccounts = () => {
    const raw = storage().getItem(accountsKey);
    if (!raw) return [];
    try {
      const accounts = JSON.parse(raw);
      if (!Array.isArray(accounts)) throw new Error("Invalid account data.");
      return accounts;
    } catch (error) {
      throw new Error("Saved device accounts could not be read. Browser data may be damaged.");
    }
  };

  const writeJson = (key, value) => {
    try {
      storage().setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new Error("Could not save your account on this device. Check available browser storage and try again.");
    }
  };

  const cryptoApi = () => {
    if (!window.crypto || !window.crypto.subtle || !window.crypto.getRandomValues) {
      throw new Error("Secure local accounts require a modern browser. Open Vaultly over HTTPS or localhost.");
    }
    return window.crypto;
  };

  const toBase64 = (bytes) => {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return window.btoa(binary);
  };

  const derivePasswordHash = async (password, salt) => {
    const crypto = cryptoApi();
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      256
    );
    return toBase64(new Uint8Array(bits));
  };

  const makeUser = (account) => ({
    id: account.id,
    email: account.email,
    user_metadata: { full_name: account.fullName },
  });

  const saveSession = (account) => writeJson(sessionKey, { userId: account.id });

  const register = async (email, password, fullName) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readAccounts();
    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error("An account already exists on this device for that email. Please sign in.");
    }

    const crypto = cryptoApi();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await derivePasswordHash(password, salt);
    const idBytes = crypto.getRandomValues(new Uint8Array(16));
    const account = {
      id: toBase64(idBytes),
      email: normalizedEmail,
      fullName: fullName.trim(),
      salt: toBase64(salt),
      passwordHash,
      createdAt: Date.now(),
    };

    saveSession(account);
    writeJson(accountsKey, [...accounts, account]);
    return makeUser(account);
  };

  const signIn = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts().find((saved) => saved.email === normalizedEmail);
    if (!account) throw new Error("Email or password is incorrect for an account on this device.");

    let actualHash;
    try {
      actualHash = await derivePasswordHash(
        password,
        Uint8Array.from(window.atob(account.salt), (character) => character.charCodeAt(0))
      );
    } catch (error) {
      if (error instanceof DOMException || error instanceof TypeError) {
        throw new Error("Saved account data could not be verified. Browser data may be damaged.");
      }
      throw error;
    }
    if (actualHash !== account.passwordHash) {
      throw new Error("Email or password is incorrect for an account on this device.");
    }

    saveSession(account);
    return makeUser(account);
  };

  const getSession = () => {
    const raw = storage().getItem(sessionKey);
    if (!raw) return null;
    let session;
    try {
      session = JSON.parse(raw);
    } catch (error) {
      storage().removeItem(sessionKey);
      throw new Error("Your saved sign-in could not be read. Please sign in again.");
    }
    const account = readAccounts().find((saved) => saved.id === session.userId);
    if (!account) {
      storage().removeItem(sessionKey);
      return null;
    }
    return { user: makeUser(account) };
  };

  const signOut = () => {
    try {
      storage().removeItem(sessionKey);
    } catch (error) {
      throw new Error("Could not sign out on this device. Check browser storage and try again.");
    }
  };

  window.vaultlyLocalAuth = { register, signIn, getSession, signOut };
})();
