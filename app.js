/**
 * Beastcoin Wallet
 * Simple admin-controlled crypto wallet using Puter.js for accounts.
 *
 * Admin access requires the password (default: 1324).
 */

// ============ CONFIG ============
const ADMIN_PASSWORD = "1324";

// Storage key for balances (localStorage for shared demo state)
const STORAGE_KEY = "beastcoin_balances_v1";
const COINS_KEY = "beastcoin_coin_types_v1";

// Default coin
const DEFAULT_COIN = "BEAST";

// ============ STATE ============
let currentUser = null;
let isAdmin = false;
let balances = {}; // { username: { BEAST: number, ... } }
let coinTypes = [DEFAULT_COIN];

// ============ DOM ============
const $ = (id) => document.getElementById(id);

const els = {
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
};

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

// ============ UI ============
function showLanding() {
  els.landing.classList.remove("hidden");
  els.dashboard.classList.add("hidden");
  els.userInfo.classList.add("hidden");
  els.signInBtn.classList.remove("hidden");
  isAdmin = false;
}

function showDashboard() {
  els.landing.classList.add("hidden");
  els.dashboard.classList.remove("hidden");
  els.userInfo.classList.remove("hidden");
  els.signInBtn.classList.add("hidden");
  els.usernameDisplay.textContent = currentUser.username || currentUser.uuid || "User";

  updateBalanceDisplay();
  updateAdminUI();
}

function updateAdminUI() {
  if (isAdmin) {
    els.adminBadge.classList.remove("hidden");
    els.adminPanel.classList.remove("hidden");
    els.adminUnlock.classList.add("hidden");
    els.userPanel.classList.add("hidden");
    renderBalancesList();
  } else {
    els.adminBadge.classList.add("hidden");
    els.adminPanel.classList.add("hidden");
    els.adminUnlock.classList.remove("hidden");
    els.userPanel.classList.remove("hidden");
    if (els.adminPassword) els.adminPassword.value = "";
    if (els.adminError) els.adminError.style.display = "none";
  }
}

function updateBalanceDisplay() {
  if (!currentUser) return;
  const bal = getUserBalance(currentUser.username, DEFAULT_COIN);
  els.balanceDisplay.innerHTML = `${bal.toFixed(2)} <span class="coin-symbol">${DEFAULT_COIN}</span>`;
}

function renderBalancesList() {
  const usernames = Object.keys(balances).sort();
  if (usernames.length === 0) {
    els.balancesList.innerHTML = `<div class="muted" style="padding:0.5rem;">No balances yet. Add coins to a username.</div>`;
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

function toast(msg) {
  alert(msg);
}

// ============ AUTH (Puter.js) ============
async function signIn() {
  try {
    await puter.auth.signIn();
    await refreshAuth();
  } catch (err) {
    console.error("Sign in failed:", err);
    toast("Sign in failed or was cancelled.");
  }
}

async function signOut() {
  try {
    await puter.auth.signOut();
  } catch (e) {
    console.warn(e);
  }
  currentUser = null;
  isAdmin = false;
  showLanding();
}

async function refreshAuth() {
  const signedIn = puter.auth.isSignedIn();
  if (!signedIn) {
    currentUser = null;
    isAdmin = false;
    showLanding();
    return;
  }
  try {
    const user = await puter.auth.getUser();
    currentUser = user;
    isAdmin = false; // always start locked; require password
    showDashboard();
  } catch (err) {
    console.error("Failed to get user:", err);
    showLanding();
  }
}

// ============ ADMIN PASSWORD ============
function unlockAdmin() {
  const entered = (els.adminPassword.value || "").trim();
  if (entered === ADMIN_PASSWORD) {
    isAdmin = true;
    updateAdminUI();
    toast("Admin unlocked.");
  } else {
    if (els.adminError) {
      els.adminError.style.display = "block";
    }
    els.adminPassword.value = "";
    els.adminPassword.focus();
  }
}

function lockAdmin() {
  isAdmin = false;
  updateAdminUI();
}

// ============ ADMIN ACTIONS ============
function handleAddCoins() {
  if (!isAdmin) return;
  const username = (els.targetUsername.value || "").trim();
  const amount = parseFloat(els.amount.value);
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
  els.amount.value = "";
  updateBalanceDisplay();
  renderBalancesList();
}

function handleRemoveCoins() {
  if (!isAdmin) return;
  const username = (els.targetUsername.value || "").trim();
  const amount = parseFloat(els.amount.value);
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
  els.amount.value = "";
  updateBalanceDisplay();
  renderBalancesList();
}

function handleAddCoinType() {
  if (!isAdmin) return;
  const name = (els.newCoinName.value || "").trim().toUpperCase();
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
  toast(`Coin type "${name}" created. (Balances still use BEAST as primary display for simplicity.)`);
  els.newCoinName.value = "";
}

// ============ INIT ============
function bindEvents() {
  els.signInBtn.addEventListener("click", signIn);
  els.landingSignIn.addEventListener("click", signIn);
  els.signOutBtn.addEventListener("click", signOut);
  els.unlockAdminBtn.addEventListener("click", unlockAdmin);
  els.lockAdminBtn.addEventListener("click", lockAdmin);
  els.addCoinsBtn.addEventListener("click", handleAddCoins);
  els.removeCoinsBtn.addEventListener("click", handleRemoveCoins);
  els.addCoinTypeBtn.addEventListener("click", handleAddCoinType);

  // Allow Enter key on password field
  if (els.adminPassword) {
    els.adminPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") unlockAdmin();
    });
  }
}

async function init() {
  loadData();
  bindEvents();
  if (typeof puter !== "undefined") {
    await refreshAuth();
  } else {
    console.error("Puter.js failed to load");
    showLanding();
  }
}

document.addEventListener("DOMContentLoaded", init);
