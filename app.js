/**
 * Beastcoin Wallet
 * Simple admin-controlled crypto wallet using Puter.js for accounts.
 *
 * Admin access requires the password (default: 1324).
 */

// ============ CONFIG ============
const ADMIN_PASSWORD = "1324";
const STORAGE_KEY = "beastcoin_balances_v1";
const COINS_KEY = "beastcoin_coin_types_v1";
const DEFAULT_COIN = "BEAST";

// ============ STATE ============
let currentUser = null;
let isAdmin = false;
let balances = {};
let coinTypes = [DEFAULT_COIN];
let puterReady = false;

// ============ DOM ============
const $ = (id) => document.getElementById(id);

let els = {};

function cacheEls() {
  els = {
    signInBtn: $("sign-in-btn"),
    landingSignIn: $("landing-sign-in"),
    signOutBtn: $("sign-out-btn"),
    userInfo: $("user-info"),
    usernameDisplay: $("username-display"),
    landing: $("landing"),
    dashboard: $("dashboard"),
    balanceDisplay: $("balance-display"),
    adminBadge: $("admin-badge"),
    userPanel: $("user-panel"),
    adminUnlock: $("admin-unlock"),
    adminPanel: $("admin-panel"),
    adminPassword: $("admin-password"),
    unlockAdminBtn: $("unlock-admin-btn"),
    lockAdminBtn: $("lock-admin-btn"),
    adminError: $("admin-error"),
    targetUsername: $("target-username"),
    amount: $("amount"),
    addCoinsBtn: $("add-coins-btn"),
    removeCoinsBtn: $("remove-coins-btn"),
    newCoinName: $("new-coin-name"),
    addCoinTypeBtn: $("add-coin-type-btn"),
    balancesList: $("balances-list"),
    statusMsg: $("status-msg"),
  };
}

// ============ STORAGE ============
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    balances = raw ? JSON.parse(raw) : {};
  } catch {
    balances = {};
  }
  try {
    const coins = localStorage.getItem(COINS_KEY);
    coinTypes = coins ? JSON.parse(coins) : [DEFAULT_COIN];
    if (!coinTypes.includes(DEFAULT_COIN)) coinTypes.unshift(DEFAULT_COIN);
  } catch {
    coinTypes = [DEFAULT_COIN];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(balances));
  localStorage.setItem(COINS_KEY, JSON.stringify(coinTypes));
}

function getUserBalance(username, coin = DEFAULT_COIN) {
  if (!balances[username]) return 0;
  return balances[username][coin] || 0;
}

function setUserBalance(username, coin, amount) {
  if (!balances[username]) balances[username] = {};
  balances[username][coin] = Math.max(0, Number(amount) || 0);
  saveData();
}

function addToBalance(username, coin, delta) {
  const current = getUserBalance(username, coin);
  setUserBalance(username, coin, current + delta);
}

// ============ UI HELPERS ============
function setStatus(msg, isError = false) {
  if (!els.statusMsg) return;
  els.statusMsg.textContent = msg || "";
  els.statusMsg.style.color = isError ? "#ef4444" : "#8b9bb4";
  els.statusMsg.style.display = msg ? "block" : "none";
}

function toast(msg) {
  setStatus(msg);
  try {
    alert(msg);
  } catch (_) {}
}

function setButtonsLoading(loading) {
  const btns = [els.signInBtn, els.landingSignIn];
  btns.forEach((btn) => {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.oldText = btn.textContent;
      btn.textContent = "Opening Puter…";
    } else if (btn.dataset.oldText) {
      btn.textContent = btn.dataset.oldText;
    }
  });
}

function showLanding() {
  if (els.landing) els.landing.classList.remove("hidden");
  if (els.dashboard) els.dashboard.classList.add("hidden");
  if (els.userInfo) els.userInfo.classList.add("hidden");
  if (els.signInBtn) els.signInBtn.classList.remove("hidden");
  isAdmin = false;
}

function showDashboard() {
  if (els.landing) els.landing.classList.add("hidden");
  if (els.dashboard) els.dashboard.classList.remove("hidden");
  if (els.userInfo) els.userInfo.classList.remove("hidden");
  if (els.signInBtn) els.signInBtn.classList.add("hidden");
  if (els.usernameDisplay) {
    els.usernameDisplay.textContent =
      (currentUser && (currentUser.username || currentUser.uuid)) || "User";
  }
  updateBalanceDisplay();
  updateAdminUI();
}

function updateAdminUI() {
  if (!els.adminPanel) return;
  if (isAdmin) {
    if (els.adminBadge) els.adminBadge.classList.remove("hidden");
    els.adminPanel.classList.remove("hidden");
    if (els.adminUnlock) els.adminUnlock.classList.add("hidden");
    if (els.userPanel) els.userPanel.classList.add("hidden");
    renderBalancesList();
  } else {
    if (els.adminBadge) els.adminBadge.classList.add("hidden");
    els.adminPanel.classList.add("hidden");
    if (els.adminUnlock) els.adminUnlock.classList.remove("hidden");
    if (els.userPanel) els.userPanel.classList.remove("hidden");
    if (els.adminPassword) els.adminPassword.value = "";
    if (els.adminError) els.adminError.style.display = "none";
  }
}

function updateBalanceDisplay() {
  if (!currentUser || !els.balanceDisplay) return;
  const bal = getUserBalance(currentUser.username, DEFAULT_COIN);
  els.balanceDisplay.innerHTML =
    `${bal.toFixed(2)} <span class="coin-symbol">${DEFAULT_COIN}</span>`;
}

function renderBalancesList() {
  if (!els.balancesList) return;
  const usernames = Object.keys(balances).sort();
  if (usernames.length === 0) {
    els.balancesList.innerHTML =
      `<div class="muted" style="padding:0.5rem;">No balances yet. Add coins to a username.</div>`;
    return;
  }
  els.balancesList.innerHTML = usernames
    .map((u) => {
      const bal = getUserBalance(u, DEFAULT_COIN);
      return `<div class="balance-row"><span class="name">${escapeHtml(u)}</span><span class="amt">${bal.toFixed(2)} ${DEFAULT_COIN}</span></div>`;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}

// ============ AUTH (Puter.js) ============
async function signIn() {
  setStatus("Starting sign-in…");
  setButtonsLoading(true);

  if (typeof puter === "undefined" || !puter.auth) {
    setButtonsLoading(false);
    toast(
      "Puter.js did not load. Please use a real web server (not file://) and allow the script from js.puter.com. Then refresh."
    );
    return;
  }

  try {
    await puter.auth.signIn();
    await refreshAuth();
    setStatus("Signed in successfully.");
  } catch (err) {
    console.error("Sign in failed:", err);
    setButtonsLoading(false);

    const code = err && (err.error || err.code);
    const msg = (err && (err.msg || err.message)) || String(err);

    if (code === "popup_blocked") {
      toast(
        "Sign-in popup was blocked. Allow popups for this site and try again."
      );
    } else if (code === "auth_window_closed") {
      setStatus("Sign-in window was closed. Try again.", true);
    } else if (code === "not_available_in_app") {
      await refreshAuth();
    } else {
      toast("Sign in failed: " + msg);
    }
  } finally {
    setButtonsLoading(false);
  }
}

async function signOut() {
  try {
    if (typeof puter !== "undefined" && puter.auth) {
      await puter.auth.signOut();
    }
  } catch (e) {
    console.warn(e);
  }
  currentUser = null;
  isAdmin = false;
  setStatus("");
  showLanding();
}

async function refreshAuth() {
  if (typeof puter === "undefined" || !puter.auth) {
    showLanding();
    return;
  }

  let signedIn = false;
  try {
    signedIn = !!puter.auth.isSignedIn();
  } catch (e) {
    console.warn("isSignedIn error", e);
  }

  if (!signedIn) {
    currentUser = null;
    isAdmin = false;
    showLanding();
    return;
  }

  try {
    const user = await puter.auth.getUser();
    currentUser = user;
    isAdmin = false;
    showDashboard();
    setStatus("Signed in as " + (user.username || user.uuid || "user"));
  } catch (err) {
    console.error("Failed to get user:", err);
    showLanding();
  }
}

// ============ ADMIN ============
function unlockAdmin() {
  const entered = (els.adminPassword && els.adminPassword.value) || "";
  if (entered.trim() === ADMIN_PASSWORD) {
    isAdmin = true;
    updateAdminUI();
    setStatus("Admin unlocked.");
  } else {
    if (els.adminError) els.adminError.style.display = "block";
    if (els.adminPassword) {
      els.adminPassword.value = "";
      els.adminPassword.focus();
    }
  }
}

function lockAdmin() {
  isAdmin = false;
  updateAdminUI();
  setStatus("Admin locked.");
}

function handleAddCoins() {
  if (!isAdmin) return;
  const username = ((els.targetUsername && els.targetUsername.value) || "").trim();
  const amount = parseFloat(els.amount && els.amount.value);
  if (!username) {
    toast("Enter a username.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    toast("Enter a valid positive amount.");
    return;
  }
  addToBalance(username, DEFAULT_COIN, amount);
  toast(`Added ${amount} ${DEFAULT_COIN} to ${username}`);
  if (els.amount) els.amount.value = "";
  updateBalanceDisplay();
  renderBalancesList();
}

function handleRemoveCoins() {
  if (!isAdmin) return;
  const username = ((els.targetUsername && els.targetUsername.value) || "").trim();
  const amount = parseFloat(els.amount && els.amount.value);
  if (!username) {
    toast("Enter a username.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    toast("Enter a valid positive amount.");
    return;
  }
  const current = getUserBalance(username, DEFAULT_COIN);
  if (amount > current) {
    toast(`User only has ${current.toFixed(2)}. Removing all.`);
    setUserBalance(username, DEFAULT_COIN, 0);
  } else {
    addToBalance(username, DEFAULT_COIN, -amount);
  }
  toast(`Removed ${amount} ${DEFAULT_COIN} from ${username}`);
  if (els.amount) els.amount.value = "";
  updateBalanceDisplay();
  renderBalancesList();
}

function handleAddCoinType() {
  if (!isAdmin) return;
  const name = ((els.newCoinName && els.newCoinName.value) || "").trim().toUpperCase();
  if (!name || name.length < 2) {
    toast("Enter a valid coin symbol (at least 2 chars).");
    return;
  }
  if (coinTypes.includes(name)) {
    toast("That coin already exists.");
    return;
  }
  coinTypes.push(name);
  saveData();
  toast(`Coin type "${name}" created.`);
  if (els.newCoinName) els.newCoinName.value = "";
}

// ============ INIT ============
function bindEvents() {
  if (els.signInBtn) {
    els.signInBtn.addEventListener("click", function (e) {
      e.preventDefault();
      signIn();
    });
  }
  if (els.landingSignIn) {
    els.landingSignIn.addEventListener("click", function (e) {
      e.preventDefault();
      signIn();
    });
  }
  if (els.signOutBtn) {
    els.signOutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      signOut();
    });
  }
  if (els.unlockAdminBtn) {
    els.unlockAdminBtn.addEventListener("click", function (e) {
      e.preventDefault();
      unlockAdmin();
    });
  }
  if (els.lockAdminBtn) {
    els.lockAdminBtn.addEventListener("click", function (e) {
      e.preventDefault();
      lockAdmin();
    });
  }
  if (els.addCoinsBtn) {
    els.addCoinsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleAddCoins();
    });
  }
  if (els.removeCoinsBtn) {
    els.removeCoinsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleRemoveCoins();
    });
  }
  if (els.addCoinTypeBtn) {
    els.addCoinTypeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handleAddCoinType();
    });
  }
  if (els.adminPassword) {
    els.adminPassword.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        unlockAdmin();
      }
    });
  }
}

function waitForPuter(maxMs) {
  return new Promise(function (resolve) {
    if (typeof puter !== "undefined" && puter.auth) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const t = setInterval(function () {
      if (typeof puter !== "undefined" && puter.auth) {
        clearInterval(t);
        resolve(true);
      } else if (Date.now() - start > maxMs) {
        clearInterval(t);
        resolve(false);
      }
    }, 50);
  });
}

async function init() {
  cacheEls();
  loadData();
  bindEvents();
  showLanding();
  setStatus("Loading Puter…");

  puterReady = await waitForPuter(8000);

  if (!puterReady) {
    setStatus(
      "Puter.js failed to load. Open this site via a web server (GitHub Pages, Netlify, or npx serve). Do not open the HTML file directly.",
      true
    );
    return;
  }

  setStatus("Ready. Click Sign in / Get Started.");
  try {
    await refreshAuth();
  } catch (e) {
    console.warn(e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
