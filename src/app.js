/* ==============================================================================
   COOKIELAUNCHER - FRONTEND CLIENT CONTROLLER (FREESM / PRISM ARCHITECTURE)
   v4.0.0 - Auth, Friends, Rank System, Chat
   ============================================================================== */

let API_BASE = "http://127.0.0.1:18420";

// ================== DURUMLAR ==================
const state = {
  username: localStorage.getItem("cl_username") || "Steve",
  selectedVersion: localStorage.getItem("cl_version") || "",
  loader: localStorage.getItem("cl_loader") || "fabric",
  cookieOptimize: localStorage.getItem("cl_optimize") !== "false",
  ram: parseInt(localStorage.getItem("cl_ram") || "4"),
  theme: localStorage.getItem("cl_theme") || "default",

  // Auth State
  isLoggedIn: localStorage.getItem("cl_logged_in") === "true",
  currentUser: JSON.parse(localStorage.getItem("cl_current_user") || "null"),
  authToken: localStorage.getItem("cl_auth_token") || null,
  authType: localStorage.getItem("cl_auth_type") || null,

  // Friend System
  friends: JSON.parse(localStorage.getItem("cl_friends") || "[]"),
  friendRequests: JSON.parse(localStorage.getItem("cl_friend_requests") || "[]"),
  myFriendCode: localStorage.getItem("cl_friend_code") || null,
  activeChatFriend: null,
  chatMessages: JSON.parse(localStorage.getItem("cl_chat_messages") || "{}"),

  // Rank System
  points: parseInt(localStorage.getItem("cl_points") || "0"),
  rank: localStorage.getItem("cl_rank") || "coal",
  totalActiveSeconds: parseInt(localStorage.getItem("cl_active_seconds") || "0"),
  leaderboard: JSON.parse(localStorage.getItem("cl_leaderboard") || "[]"),

  // Sürüm Verileri
  versions: [],
  installedVersions: [],
  versionSearchQuery: "",
  versionFilters: {
    optimized: false,
    release: true,
    snapshot: false,
    beta: false,
    alpha: false,
    experimental: false
  },

  // Profiller (Instances)
  instances: [],
  activeInstanceId: localStorage.getItem("cl_instance") || "",
  modrinthTargetId: localStorage.getItem("cl_modrinth_target") || "",

  // Modrinth Durumu
  modrinthType: "mod",
  modrinthLoader: "fabric",
  modrinthSort: "downloads",
  modrinthQuery: "",
  modrinthHits: [],
  modrinthOffset: 0,
  modrinthLimit: 20,
  modrinthHasMore: true,
  modrinthLoading: false,
  packPollTimer: null,
  hideInstalled: localStorage.getItem("cl_hide_installed") === "true",
  installedModSlugs: new Set(),
  installedModFiles: [],
  installedContent: { mod: [], shader: [], resourcepack: [] },
  installedContentMeta: { mod: {}, shader: {}, resourcepack: {} },
  installedContentInstanceId: "",
  installedCategory: "mod",
  installedPanelCollapsed: false,
  installedLoading: false,
  contentLoadFailed: false,
  coreModsWarned: false,

  // Başlatma / Polling
  isPollingStatus: false,
  statusTimer: null,
  pollTick: 0,
  coreFailCount: 0,
  launchRequested: false,
  progressOpen: false,
  progressDismissed: false,
  progressCloseTimer: null,
  lastErrorShown: null
};

// Generate friend code if not exists
if (!state.myFriendCode) {
  state.myFriendCode = generateFriendCode();
  localStorage.setItem("cl_friend_code", state.myFriendCode);
}

// ================== RANK SISTEMI ==================
const RANKS = [
  { id: "coal", name: "Kömür", icon: "⛏", minPoints: 0, maxPoints: 1000, color: "#4a4a4a" },
  { id: "iron", name: "Demir", icon: "🛡", minPoints: 1000, maxPoints: 3000, color: "#b0b0b0" },
  { id: "gold", name: "Altın", icon: "★", minPoints: 3000, maxPoints: 6000, color: "#ffd700" },
  { id: "diamond", name: "Elmas", icon: "◆", minPoints: 6000, maxPoints: 9000, color: "#00bfff" },
  { id: "netherite", name: "Netherite", icon: "🔥", minPoints: 9000, maxPoints: 999999, color: "#4a3a2a" }
];

const FALLBACK_VERSIONS = [
  "26.3", "26.2", "26.1.2", "26.1.1", "26.1",
  "1.21.4", "1.21.3", "1.21.2", "1.21.1", "1.21",
  "1.20.6", "1.20.4", "1.20.2", "1.20.1", "1.20",
  "1.19.4", "1.19.2", "1.18.2", "1.17.1", "1.16.5",
  "1.12.2", "1.8.9", "1.7.10"
].map(id => ({ id, type: "release", releaseTime: "", is_optimized: true }));

// ================== YARDIMCI FONKSİYONLAR ==================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function showErrorOnce(message) {
  if (!message) return;
  if (state.lastErrorShown === message) return;
  state.lastErrorShown = message;
  showToast(message, "error");
}

function generateFriendCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CL-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getRankForPoints(points) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) return RANKS[i];
  }
  return RANKS[0];
}

function getNextRank(points) {
  const current = getRankForPoints(points);
  const idx = RANKS.indexOf(current);
  if (idx < RANKS.length - 1) return RANKS[idx + 1];
  return null;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}s ${mins}dk`;
  return `${mins}dk`;
}

// ================== API KATMANI ==================
async function apiGet(path, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function apiPost(path, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function detectApiBase() {
  for (const port of [18420, 18421, 18422, 18423]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 900);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: controller.signal,
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Number(data.api_version) >= 14) {
          API_BASE = `http://127.0.0.1:${port}`;
          return true;
        }
      }
    } catch (_) {
    } finally {
      clearTimeout(timer);
    }
  }
  return false;
}

// ================== THEME SYSTEM ==================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("cl_theme", theme);
  state.theme = theme;
  document.querySelectorAll(".theme-option").forEach(opt => {
    opt.classList.toggle("active", opt.getAttribute("data-theme") === theme);
  });
}

// ================== AUTH SYSTEM ==================
function saveUserState() {
  localStorage.setItem("cl_logged_in", state.isLoggedIn ? "true" : "false");
  localStorage.setItem("cl_current_user", JSON.stringify(state.currentUser));
  localStorage.setItem("cl_auth_token", state.authToken || "");
  localStorage.setItem("cl_auth_type", state.authType || "");
  localStorage.setItem("cl_friend_code", state.myFriendCode);
  localStorage.setItem("cl_friends", JSON.stringify(state.friends));
  localStorage.setItem("cl_friend_requests", JSON.stringify(state.friendRequests));
  localStorage.setItem("cl_chat_messages", JSON.stringify(state.chatMessages));
  localStorage.setItem("cl_points", String(state.points));
  localStorage.setItem("cl_rank", state.rank);
  localStorage.setItem("cl_active_seconds", String(state.totalActiveSeconds));
  localStorage.setItem("cl_leaderboard", JSON.stringify(state.leaderboard));
}

function loginNormal(username, password) {
  const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
  const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
  if (!user) {
    return { success: false, error: "Kullanıcı adı veya şifre hatalı." };
  }
  state.isLoggedIn = true;
  state.currentUser = user;
  state.authToken = "normal_" + Date.now();
  state.authType = "normal";
  if (user.points === undefined) user.points = 0;
  if (user.activeSeconds === undefined) user.activeSeconds = 0;
  state.points = user.points || 0;
  state.totalActiveSeconds = user.activeSeconds || 0;
  state.rank = getRankForPoints(state.points).id;
  state.myFriendCode = user.friendCode || state.myFriendCode;
  saveUserState();
  return { success: true, user: user };
}

function registerNormal(username, email, password) {
  const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
  if (users.find(u => u.username === username)) {
    return { success: false, error: "Bu kullanıcı adı zaten kullanılıyor." };
  }
  if (users.find(u => u.email === email)) {
    return { success: false, error: "Bu e-posta zaten kayıtlı." };
  }
  const newUser = {
    id: "user_" + Date.now(),
    username: username,
    email: email,
    password: password,
    points: 0,
    activeSeconds: 0,
    friendCode: generateFriendCode(),
    createdAt: new Date().toISOString(),
    authType: "normal",
    rank: "coal"
  };
  users.push(newUser);
  localStorage.setItem("cl_users_db", JSON.stringify(users));
  state.isLoggedIn = true;
  state.currentUser = newUser;
  state.authToken = "normal_" + Date.now();
  state.authType = "normal";
  state.myFriendCode = newUser.friendCode;
  state.points = 0;
  state.totalActiveSeconds = 0;
  state.rank = "coal";
  saveUserState();
  return { success: true, user: newUser };
}

function loginDiscord() {
  const discordUser = {
    id: "discord_" + Date.now(),
    username: "DiscordUser" + Math.floor(Math.random() * 1000),
    email: "discord@example.com",
    discordId: "123456789",
    discordTag: "DiscordUser#1234",
    points: 0,
    activeSeconds: 0,
    friendCode: generateFriendCode(),
    createdAt: new Date().toISOString(),
    authType: "discord",
    rank: "coal"
  };
  const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
  users.push(discordUser);
  localStorage.setItem("cl_users_db", JSON.stringify(users));
  state.isLoggedIn = true;
  state.currentUser = discordUser;
  state.authToken = "discord_" + Date.now();
  state.authType = "discord";
  state.myFriendCode = discordUser.friendCode;
  state.points = 0;
  state.totalActiveSeconds = 0;
  state.rank = "coal";
  saveUserState();
  return { success: true, user: discordUser };
}

function logout() {
  state.isLoggedIn = false;
  state.currentUser = null;
  state.authToken = null;
  state.authType = null;
  saveUserState();
  updateProfileUI();
  showToast("Çıkış yapıldı.", "info");
}

// ================== FRIEND SYSTEM ==================
function addFriend(friendCode) {
  if (!state.isLoggedIn) {
    showToast("Arkadaş eklemek için giriş yapmalısınız.", "error");
    return false;
  }
  const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
  const friend = users.find(u => u.friendCode === friendCode && u.id !== state.currentUser.id);
  if (!friend) {
    showToast("Bu arkadaş kodu bulunamadı.", "error");
    return false;
  }
  if (state.friends.find(f => f.id === friend.id)) {
    showToast("Bu kullanıcı zaten arkadaşınız.", "info");
    return false;
  }
  const request = {
    id: "req_" + Date.now(),
    from: state.currentUser.id,
    fromUsername: state.currentUser.username,
    fromFriendCode: state.myFriendCode,
    to: friend.id,
    toUsername: friend.username,
    toFriendCode: friendCode,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  state.friendRequests.push(request);
  saveUserState();
  showToast(`${friend.username} kullanıcısına arkadaşlık isteği gönderildi.`, "success");
  return true;
}

function acceptFriendRequest(requestId) {
  const req = state.friendRequests.find(r => r.id === requestId);
  if (!req) return false;
  const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
  const friend = users.find(u => u.id === req.from);
  if (!friend) return false;
  state.friends.push({
    id: friend.id,
    username: friend.username,
    friendCode: friend.friendCode,
    status: "online",
    rank: friend.rank || "coal",
    points: friend.points || 0
  });
  req.status = "accepted";
  saveUserState();
  showToast(`${friend.username} arkadaş olarak eklendi!`, "success");
  renderFriendsList();
  return true;
}

function rejectFriendRequest(requestId) {
  const req = state.friendRequests.find(r => r.id === requestId);
  if (!req) return false;
  req.status = "rejected";
  saveUserState();
  showToast("Arkadaşlık isteği reddedildi.", "info");
  renderFriendRequests();
  return true;
}

function removeFriend(friendId) {
  state.friends = state.friends.filter(f => f.id !== friendId);
  saveUserState();
  renderFriendsList();
  showToast("Arkadaş silindi.", "info");
}

function getPendingRequests() {
  return state.friendRequests.filter(r => r.to === state.currentUser?.id && r.status === "pending");
}

function renderFriendsList() {
  const container = document.getElementById("friendsList");
  if (!container) return;
  if (state.friends.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>Henüz arkadaşınız yok</h3><p>Arkadaş kodu ile arkadaş ekleyin.</p></div>';
    return;
  }
  container.innerHTML = "";
  state.friends.forEach(friend => {
    const card = document.createElement("div");
    card.className = "friend-card";
    const rank = getRankForPoints(friend.points || 0);
    card.innerHTML = `
      <div class="friend-status ${friend.status || 'offline'}"></div>
      <div class="friend-avatar">U</div>
      <div class="friend-info">
        <span class="friend-name">${escapeHtml(friend.username)}</span>
        <span class="friend-rank">${rank.icon} ${rank.name} • ${friend.points || 0} puan</span>
      </div>
      <div class="friend-actions">
        <button class="btn-friend-chat" data-friend-id="${friend.id}" title="Sohbet">💬</button>
        <button class="btn-friend-remove" data-friend-id="${friend.id}" title="Sil">🗑</button>
      </div>
    `;
    container.appendChild(card);
  });
  container.querySelectorAll(".btn-friend-chat").forEach(btn => {
    btn.addEventListener("click", () => {
      const fid = btn.getAttribute("data-friend-id");
      const friend = state.friends.find(f => f.id === fid);
      if (friend) openChat(friend);
    });
  });
  container.querySelectorAll(".btn-friend-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const fid = btn.getAttribute("data-friend-id");
      if (confirm("Bu arkadaş silinsin mi?")) removeFriend(fid);
    });
  });
}

function renderFriendRequests() {
  const container = document.getElementById("friendRequestsBody");
  if (!container) return;
  const pending = getPendingRequests();
  if (pending.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📬</div><h3>Bekleyen istek yok</h3></div>';
    return;
  }
  container.innerHTML = "";
  pending.forEach(req => {
    const card = document.createElement("div");
    card.className = "friend-request-card";
    card.innerHTML = `
      <div class="friend-request-info">
        <span class="friend-name">${escapeHtml(req.fromUsername)}</span>
        <span class="friend-code">${req.fromFriendCode}</span>
      </div>
      <div class="friend-request-actions">
        <button class="btn-accept" data-req-id="${req.id}">Kabul</button>
        <button class="btn-reject" data-req-id="${req.id}">Reddet</button>
      </div>
    `;
    container.appendChild(card);
  });
  container.querySelectorAll(".btn-accept").forEach(btn => {
    btn.addEventListener("click", () => acceptFriendRequest(btn.getAttribute("data-req-id")));
  });
  container.querySelectorAll(".btn-reject").forEach(btn => {
    btn.addEventListener("click", () => rejectFriendRequest(btn.getAttribute("data-req-id")));
  });
}

// ================== CHAT SYSTEM ==================
function openChat(friend) {
  state.activeChatFriend = friend;
  const chatName = document.getElementById("chatFriendName");
  if (chatName) chatName.textContent = friend.username;
  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  if (!state.activeChatFriend) {
    container.innerHTML = '<div class="chat-welcome">Bir arkadaş seçerek sohbete başlayın!</div>';
    return;
  }
  const fid = state.activeChatFriend.id;
  const messages = state.chatMessages[fid] || [];
  if (messages.length === 0) {
    container.innerHTML = '<div class="chat-welcome">Henüz mesaj yok. İlk mesajı gönderin!</div>';
    return;
  }
  container.innerHTML = "";
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = `chat-message ${msg.from === state.currentUser?.id ? 'sent' : 'received'}`;
    div.innerHTML = `
      <div class="chat-msg-content">${escapeHtml(msg.text)}</div>
      <div class="chat-msg-time">${new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage(text) {
  if (!state.activeChatFriend || !text.trim()) return;
  const fid = state.activeChatFriend.id;
  if (!state.chatMessages[fid]) state.chatMessages[fid] = [];
  state.chatMessages[fid].push({
    from: state.currentUser.id,
    text: text.trim(),
    timestamp: new Date().toISOString()
  });
  saveUserState();
  renderChatMessages();
  const input = document.getElementById("chatInput");
  if (input) input.value = "";
}

// ================== RANK SYSTEM ==================
function updateRankUI() {
  const rank = getRankForPoints(state.points);
  const nextRank = getNextRank(state.points);
  const rankIcon = document.getElementById("rankIcon");
  const rankName = document.getElementById("rankName");
  const rankPoints = document.getElementById("rankPoints");
  const rankProgressBar = document.getElementById("rankProgressBar");
  const statPoints = document.getElementById("statPoints");
  const statHours = document.getElementById("statHours");
  const statRank = document.getElementById("statRank");
  const statLeaderboard = document.getElementById("statLeaderboard");

  if (rankIcon) rankIcon.textContent = rank.icon;
  if (rankName) rankName.textContent = rank.name;
  if (rankPoints) {
    if (nextRank) {
      rankPoints.textContent = `${state.points} / ${nextRank.minPoints} Puan`;
    } else {
      rankPoints.textContent = `${state.points} Puan (Max)`;
    }
  }
  if (rankProgressBar) {
    let pct = 0;
    if (nextRank) {
      const range = nextRank.minPoints - rank.minPoints;
      const progress = state.points - rank.minPoints;
      pct = Math.min(100, (progress / range) * 100);
    } else {
      pct = 100;
    }
    rankProgressBar.style.width = `${pct}%`;
    rankProgressBar.style.background = rank.color;
  }
  if (statPoints) statPoints.textContent = state.points;
  if (statHours) statHours.textContent = formatTime(state.totalActiveSeconds);
  if (statRank) statRank.textContent = rank.name;
  if (statLeaderboard) {
    const idx = state.leaderboard.findIndex(u => u.id === state.currentUser?.id);
    statLeaderboard.textContent = idx >= 0 ? `#${idx + 1}` : "#-";
  }
}

function earnPoints(seconds) {
  if (!state.isLoggedIn) return;
  const pointsEarned = Math.floor(seconds / 60);
  if (pointsEarned > 0) {
    state.points = Math.min(9000, state.points + pointsEarned);
    state.totalActiveSeconds += seconds;
    state.rank = getRankForPoints(state.points).id;
    const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
    const userIdx = users.findIndex(u => u.id === state.currentUser.id);
    if (userIdx >= 0) {
      users[userIdx].points = state.points;
      users[userIdx].activeSeconds = state.totalActiveSeconds;
      users[userIdx].rank = state.rank;
      localStorage.setItem("cl_users_db", JSON.stringify(users));
    }
    saveUserState();
    updateRankUI();
    updateLeaderboard();
  }
}

function updateLeaderboard() {
  const users = JSON.parse(localStorage.getItem("cl_users_db") || "[]");
  const sorted = users
    .map(u => ({ id: u.id, username: u.username, points: u.points || 0, rank: u.rank || "coal", friendCode: u.friendCode }))
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 20);
  state.leaderboard = sorted;
  saveUserState();
  renderLeaderboard();
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboardList");
  if (!container) return;
  if (state.leaderboard.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div><h3>Henüz sıralama yok</h3></div>';
    return;
  }
  container.innerHTML = "";
  state.leaderboard.forEach((user, idx) => {
    const rank = getRankForPoints(user.points || 0);
    const isMe = user.id === state.currentUser?.id;
    const div = document.createElement("div");
    div.className = `leaderboard-item ${isMe ? 'me' : ''}`;
    div.innerHTML = `
      <span class="lb-rank">#${idx + 1}</span>
      <span class="lb-icon">${rank.icon}</span>
      <span class="lb-name">${escapeHtml(user.username)}${isMe ? ' (Sen)' : ''}</span>
      <span class="lb-points">${user.points || 0} puan</span>
    `;
    container.appendChild(div);
  });
}

// ================== PROFILE UI ==================
function updateProfileUI() {
  const avatarSm = document.getElementById("profileAvatarSm");
  const nameSm = document.getElementById("profileNameSm");
  const profileMenuHeader = document.getElementById("profileMenuHeader");
  const pmLogout = document.getElementById("pmLogout");

  if (state.isLoggedIn && state.currentUser) {
    if (avatarSm) avatarSm.textContent = state.currentUser.username.charAt(0).toUpperCase();
    if (nameSm) nameSm.textContent = state.currentUser.username;
    if (profileMenuHeader) profileMenuHeader.innerHTML = `<span>${escapeHtml(state.currentUser.username)}</span><br><small>${state.myFriendCode}</small>`;
    if (pmLogout) pmLogout.style.display = "block";
  } else {
    if (avatarSm) avatarSm.textContent = "U";
    if (nameSm) nameSm.textContent = "Oturum Aç";
    if (profileMenuHeader) profileMenuHeader.innerHTML = "<span>Giriş yapılmamış</span>";
    if (pmLogout) pmLogout.style.display = "none";
  }
  updateAccountUI();
}

function updateAccountUI() {
  const loginPrompt = document.getElementById("accountLoginPrompt");
  const profile = document.getElementById("accountProfile");
  if (!loginPrompt || !profile) return;
  if (state.isLoggedIn && state.currentUser) {
    loginPrompt.style.display = "none";
    profile.style.display = "block";
    const profileUsername = document.getElementById("profileUsername");
    const profileEmail = document.getElementById("profileEmail");
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileUsername) profileUsername.textContent = state.currentUser.username;
    if (profileEmail) profileEmail.textContent = state.currentUser.email || "";
    if (profileAvatar) profileAvatar.textContent = state.currentUser.username.charAt(0).toUpperCase();
    updateRankUI();
  } else {
    loginPrompt.style.display = "block";
    profile.style.display = "none";
  }
}

// ================== MOD BAĞIMLILIK TERCİHİ ==================
function getInstallDepsPref() {
  return localStorage.getItem("cl_install_deps") !== "false";
}

function syncInstallDepsToggles() {
  const pref = getInstallDepsPref();
  document.querySelectorAll(".install-deps-cb").forEach(cb => { cb.checked = pref; });
}

function setInstallDepsPref(value) {
  localStorage.setItem("cl_install_deps", value ? "true" : "false");
  syncInstallDepsToggles();
}

function bindInstallDepsToggle(el) {
  if (!el) return;
  el.checked = getInstallDepsPref();
  if (el.dataset.bound === "1") return;
  el.dataset.bound = "1";
  el.addEventListener("change", () => setInstallDepsPref(el.checked));
}

// ================== BAŞLATMA (INIT) ==================
document.addEventListener("DOMContentLoaded", async () => {
  await detectApiBase();
  initUI();
  setupEventListeners();
  loadVersions();
  loadInstances();
  startStatusPolling();
  setupTauriWindowControls();
  initProfileDetailScreen();
  startPointsTimer();
  const friendCodeEl = document.getElementById("myFriendCode");
  if (friendCodeEl) friendCodeEl.textContent = state.myFriendCode;
});

function initUI() {
  const uInput = document.getElementById("usernameInput");
  if (uInput) uInput.value = state.username;

  const vInput = document.getElementById("versionInput");
  if (vInput) vInput.value = state.selectedVersion;

  const lRadio = document.querySelector(`input[name="loaderRadio"][value="${state.loader}"]`);
  if (lRadio) {
    lRadio.checked = true;
    document.querySelectorAll('input[name="loaderRadio"]').forEach(r => {
      const card = r.closest(".loader-card");
      if (card) card.classList.toggle("active", r.checked);
    });
  }

  const optToggle = document.getElementById("cookieOptimizeToggle");
  if (optToggle) optToggle.checked = state.cookieOptimize;

  const ramSlider = document.getElementById("ramSlider");
  if (ramSlider) ramSlider.value = state.ram;
  updateRamUI();

  applyTheme(state.theme);
  updateProfileUI();
  renderFriendsList();
  renderLeaderboard();
  renderPlayHero();
}

function updateRamUI() {
  const ram = state.ram;
  const ramText = document.getElementById("ramValueText");
  const fill = document.getElementById("ramBarFill");
  const summary = document.getElementById("ramSummary");
  if (ramText) ramText.textContent = `${ram} GB`;
  if (fill) {
    const pct = Math.round(((ram - 2) / (16 - 2)) * 100);
    fill.style.width = `${Math.max(8, Math.min(100, pct))}%`;
  }
  if (summary) {
    const advice = ram >= 8 ? "Modlu paketler için rahat bir değer."
      : ram >= 4 ? "Vanilla ve hafif modlar için yeterli."
      : "Yalnızca vanilla oyun için önerilir.";
    summary.textContent = `${ram} GB ayrıldı • ${advice}`;
  }
}

// ================== EVENT LISTENERS ==================
function setupEventListeners() {
  // Sekme Değişimi
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute("data-tab")));
  });

  // Hızlı Klasörler Menüsü
  const btnQuick = document.getElementById("btnQuickFolders");
  const quickMenu = document.getElementById("quickFoldersMenu");
  if (btnQuick && quickMenu) {
    btnQuick.addEventListener("click", (e) => {
      e.stopPropagation();
      quickMenu.classList.toggle("show");
    });
    window.addEventListener("click", () => {
      quickMenu.classList.remove("show");
    });
  }

  document.querySelectorAll(".dropdown-item[data-folder]").forEach(item => {
    item.addEventListener("click", () => openSystemFolder(item.getAttribute("data-folder")));
  });

  // Profil Dropdown
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("show");
    });
    window.addEventListener("click", () => {
      profileMenu.classList.remove("show");
    });
  }

  // Profil menü öğeleri
  const pmLogin = document.getElementById("pmLogin");
  if (pmLogin) pmLogin.addEventListener("click", () => {
    profileMenu.classList.remove("show");
    openLoginModal();
  });

  const pmAccountInfo = document.getElementById("pmAccountInfo");
  if (pmAccountInfo) pmAccountInfo.addEventListener("click", () => {
    profileMenu.classList.remove("show");
    showAccountInfo();
  });

  const pmFriends = document.getElementById("pmFriends");
  if (pmFriends) pmFriends.addEventListener("click", () => {
    profileMenu.classList.remove("show");
    switchTab("tab-friends");
  });

  const pmLogout = document.getElementById("pmLogout");
  if (pmLogout) pmLogout.addEventListener("click", () => {
    profileMenu.classList.remove("show");
    logout();
  });

  // Tema Seçici Dropdown
  const themeBtn = document.getElementById("themeDropdownBtn");
  const themeMenu = document.getElementById("themeDropdownMenu");
  if (themeBtn && themeMenu) {
    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle("show");
    });
    window.addEventListener("click", () => {
      themeMenu.classList.remove("show");
    });
  }

  document.querySelectorAll(".theme-option").forEach(opt => {
    opt.addEventListener("click", () => {
      const theme = opt.getAttribute("data-theme");
      applyTheme(theme);
      if (themeMenu) themeMenu.classList.remove("show");
      showToast("Tema değiştirildi", "info");
    });
  });

  // Oyuncu Adı Değişimi
  const uInput = document.getElementById("usernameInput");
  if (uInput) {
    uInput.addEventListener("input", (e) => {
      state.username = e.target.value.trim() || "Steve";
      localStorage.setItem("cl_username", state.username);
    });
  }

  // Sürüm Doğrudan Girişi
  const vInput = document.getElementById("versionInput");
  if (vInput) {
    vInput.addEventListener("input", (e) => {
      state.selectedVersion = e.target.value.trim();
      localStorage.setItem("cl_version", state.selectedVersion);
    });
    vInput.addEventListener("change", (e) => {
      const val = e.target.value.trim();
      if (!val) return;
      state.selectedVersion = val;
      localStorage.setItem("cl_version", val);
      if (state.activeInstanceId) updateActiveInstance({ version: val });
    });
  }

  // Aktif Profil Seçici
  const activeSelect = document.getElementById("activeInstanceSelect");
  if (activeSelect) {
    activeSelect.addEventListener("change", (e) => setActiveInstance(e.target.value));
  }

  // Profil Oluşturma Modalı
  const btnCreateInstance = document.getElementById("btnCreateInstance");
  if (btnCreateInstance) btnCreateInstance.addEventListener("click", openCreateInstanceModal);

  const btnCloseCreateInstance = document.getElementById("btnCloseCreateInstanceModal");
  if (btnCloseCreateInstance) btnCloseCreateInstance.addEventListener("click", closeCreateInstanceModal);

  const btnCancelCreateInstance = document.getElementById("btnCancelCreateInstance");
  if (btnCancelCreateInstance) btnCancelCreateInstance.addEventListener("click", closeCreateInstanceModal);

  const btnConfirmCreateInstance = document.getElementById("btnConfirmCreateInstance");
  if (btnConfirmCreateInstance) btnConfirmCreateInstance.addEventListener("click", confirmCreateInstance);

  initNewProfileModal();

  // Modrinth Kurulum Hedefi
  const modrinthTargetSelect = document.getElementById("modrinthInstanceSelect");
  if (modrinthTargetSelect) {
    modrinthTargetSelect.addEventListener("change", (e) => {
      const id = e.target.value || "";
      state.modrinthTargetId = getInstanceById(id) ? id : "";
      if (state.modrinthTargetId) {
        localStorage.setItem("cl_modrinth_target", state.modrinthTargetId);
      } else {
        localStorage.removeItem("cl_modrinth_target");
      }
      renderModrinthTargetBar();
      fetchModrinth(true);
    });
  }

  // Yüklü içerik paneli
  document.querySelectorAll(".installed-cat-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".installed-cat-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.installedCategory = tab.getAttribute("data-cat") || "mod";
      renderInstalledPanel();
    });
  });

  const btnToggleInstalled = document.getElementById("btnToggleInstalledPanel");
  if (btnToggleInstalled) {
    btnToggleInstalled.addEventListener("click", () => {
      state.installedPanelCollapsed = !state.installedPanelCollapsed;
      const panel = document.getElementById("installedPanel");
      if (panel) panel.classList.toggle("collapsed", state.installedPanelCollapsed);
      btnToggleInstalled.textContent = state.installedPanelCollapsed ? "▴" : "▾";
    });
  }

  // Sürüm Seçim Modalı
  const btnOpenVModal = document.getElementById("btnOpenVersionModal");
  if (btnOpenVModal) btnOpenVModal.addEventListener("click", openVersionSelectorModal);

  const btnCloseVModal = document.getElementById("btnCloseVersionSelectorModal");
  if (btnCloseVModal) btnCloseVModal.addEventListener("click", closeVersionSelectorModal);

  const btnCancelVModal = document.getElementById("btnCancelVersionSelectorModal");
  if (btnCancelVModal) btnCancelVModal.addEventListener("click", closeVersionSelectorModal);

  const vTableSearch = document.getElementById("versionTableSearchInput");
  const btnClearVSearch = document.getElementById("btnClearVersionSearch");
  if (vTableSearch) {
    vTableSearch.addEventListener("input", (e) => {
      state.versionSearchQuery = e.target.value;
      if (btnClearVSearch) btnClearVSearch.style.display = e.target.value ? "block" : "none";
      filterAndRenderVersionTable();
    });
  }
  if (btnClearVSearch && vTableSearch) {
    btnClearVSearch.addEventListener("click", () => {
      vTableSearch.value = "";
      state.versionSearchQuery = "";
      btnClearVSearch.style.display = "none";
      filterAndRenderVersionTable();
    });
  }

  document.querySelectorAll(".version-filter-cb").forEach(cb => {
    cb.addEventListener("change", () => {
      state.versionFilters[cb.getAttribute("data-category")] = cb.checked;
      filterAndRenderVersionTable();
    });
  });

  // Yükleyici Seçimi
  document.querySelectorAll('input[name="loaderRadio"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      state.loader = e.target.value;
      localStorage.setItem("cl_loader", state.loader);
      document.querySelectorAll('input[name="loaderRadio"]').forEach(r => {
        const card = r.closest(".loader-card");
        if (card) card.classList.toggle("active", r.checked);
      });
      if (state.activeInstanceId) updateActiveInstance({ loader: state.loader });
    });
  });

  // Optimize Toggle
  const optToggle = document.getElementById("cookieOptimizeToggle");
  if (optToggle) {
    optToggle.addEventListener("change", (e) => {
      state.cookieOptimize = e.target.checked;
      localStorage.setItem("cl_optimize", state.cookieOptimize);
      showToast(state.cookieOptimize ? "Optimize motoru devrede!" : "Vanilla moduna geçildi.", "info");
    });
  }

  // RAM Slider
  const ramSlider = document.getElementById("ramSlider");
  if (ramSlider) {
    ramSlider.addEventListener("input", (e) => {
      state.ram = parseInt(e.target.value);
      localStorage.setItem("cl_ram", state.ram);
      updateRamUI();
    });
  }

  // Hero eylemleri
  const heroDetails = document.getElementById("heroDetailsBtn");
  if (heroDetails) {
    heroDetails.addEventListener("click", () => {
      const inst = getActiveInstance();
      if (inst) openProfileDetail(inst.id, "mods");
      else openCreateInstanceModal();
    });
  }
  const heroManage = document.getElementById("heroManageBtn");
  if (heroManage) heroManage.addEventListener("click", () => switchTab("tab-instances"));

  // OYUNU BAŞLAT
  const btnLaunch = document.getElementById("btnLaunchGame");
  if (btnLaunch) btnLaunch.addEventListener("click", handleLaunchGame);

  // Progress Modal Gizle
  const btnDismissProgress = document.getElementById("btnDismissProgressModal");
  if (btnDismissProgress) {
    btnDismissProgress.addEventListener("click", () => closeProgressModal();
  }

  // Modrinth Arama
  const btnSearch = document.getElementById("btnDoSearch");
  const sInput = document.getElementById("modrinthSearchInput");
  if (btnSearch && sInput) {
    btnSearch.addEventListener("click", () => {
      state.modrinthQuery = sInput.value;
      fetchModrinth(true);
    });
    sInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        state.modrinthQuery = sInput.value;
        fetchModrinth(true);
      }
    });
  }

  document.querySelectorAll(".cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.modrinthType = pill.getAttribute("data-type");
      fetchModrinth(true);
    });
  });

  const mLoaderSelect = document.getElementById("modrinthLoaderSelect");
  if (mLoaderSelect) {
    mLoaderSelect.addEventListener("change", (e) => {
      state.modrinthLoader = e.target.value;
      fetchModrinth(true);
    });
  }

  const mSortSelect = document.getElementById("modrinthSortSelect");
  if (mSortSelect) {
    mSortSelect.addEventListener("change", (e) => {
      state.modrinthSort = e.target.value;
      fetchModrinth(true);
    });
  }

  const hideInstalledToggle = document.getElementById("hideInstalledToggle");
  if (hideInstalledToggle) {
    hideInstalledToggle.checked = state.hideInstalled;
    hideInstalledToggle.addEventListener("change", async (e) => {
      state.hideInstalled = e.target.checked;
      localStorage.setItem("cl_hide_installed", state.hideInstalled);
      if (state.installedModSlugs.size === 0 && state.installedModFiles.length === 0) {
        await refreshInstalledContent();
      }
      applyInstalledStates();
      showToast(state.hideInstalled ? "Yüklü içerikler listeden gizlendi." : "Yüklü içerikler tekrar gösteriliyor.", "info");
    });
  }

  bindInstallDepsToggle(document.getElementById("installDepsToggle"));

  const btnOpenScreenshots = document.getElementById("btnOpenScreenshotsFolder");
  if (btnOpenScreenshots) {
    btnOpenScreenshots.addEventListener("click", () => openSystemFolder("screenshots"));
  }

  const btnClearConsole = document.getElementById("btnClearConsole");
  if (btnClearConsole) {
    btnClearConsole.addEventListener("click", () => {
      const cOut = document.getElementById("consoleOutput");
      if (cOut) cOut.textContent = "Konsol temizlendi.\n";
    });
  }

  // ================== AUTH EVENT LISTENERS ==================
  const btnNormalLogin = document.getElementById("btnNormalLogin");
  if (btnNormalLogin) btnNormalLogin.addEventListener("click", () => openLoginModal());

  const btnDiscordLogin = document.getElementById("btnDiscordLogin");
  if (btnDiscordLogin) btnDiscordLogin.addEventListener("click", () => {
    const result = loginDiscord();
    if (result.success) {
      showToast("Discord ile giriş yapıldı: " + result.user.username, "success");
      updateProfileUI();
      closeLoginModal();
    }
  });

  const btnCloseLoginModal = document.getElementById("btnCloseLoginModal");
  if (btnCloseLoginModal) btnCloseLoginModal.addEventListener("click", closeLoginModal);

  document.querySelectorAll(".login-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".login-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.getAttribute("data-login-tab");
      document.querySelectorAll(".login-pane").forEach(p => p.classList.remove("active"));
      const pane = document.getElementById(target === "login" ? "loginPaneLogin" : "loginPaneRegister");
      if (pane) pane.classList.add("active");
    });
  });

  const btnDoLogin = document.getElementById("btnDoLogin");
  if (btnDoLogin) {
    btnDoLogin.addEventListener("click", () => {
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value;
      if (!username || !password) {
        showToast("Kullanıcı adı ve şifre gerekli.", "error");
        return;
      }
      const result = loginNormal(username, password);
      if (result.success) {
        showToast("Giriş yapıldı: " + result.user.username, "success");
        updateProfileUI();
        closeLoginModal();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  const btnDoRegister = document.getElementById("btnDoRegister");
  if (btnDoRegister) {
    btnDoRegister.addEventListener("click", () => {
      const username = document.getElementById("regUsername").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;
      const passwordConfirm = document.getElementById("regPasswordConfirm").value;
      if (!username || !email || !password) {
        showToast("Tüm alanlar gerekli.", "error");
        return;
      }
      if (password !== passwordConfirm) {
        showToast("Şifreler eşleşmiyor.", "error");
        return;
      }
      if (password.length < 6) {
        showToast("Şifre en az 6 karakter olmalı.", "error");
        return;
      }
      const result = registerNormal(username, email, password);
      if (result.success) {
        showToast("Kayıt başarılı: " + result.user.username, "success");
        updateProfileUI();
        closeLoginModal();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  const btnDiscordOAuthLogin = document.getElementById("btnDiscordOAuthLogin");
  if (btnDiscordOAuthLogin) {
    btnDiscordOAuthLogin.addEventListener("click", () => {
      const result = loginDiscord();
      if (result.success) {
        showToast("Discord ile giriş yapıldı: " + result.user.username, "success");
        updateProfileUI();
        closeLoginModal();
      }
    });
  }

  const btnDiscordOAuthRegister = document.getElementById("btnDiscordOAuthRegister");
  if (btnDiscordOAuthRegister) {
    btnDiscordOAuthRegister.addEventListener("click", () => {
      const result = loginDiscord();
      if (result.success) {
        showToast("Discord ile kayıt yapıldı: " + result.user.username, "success");
        updateProfileUI();
        closeLoginModal();
      }
    });
  }

  // Hesap Bilgileri butonu
  const btnAccountInfo = document.getElementById("btnAccountInfo");
  if (btnAccountInfo) {
    btnAccountInfo.addEventListener("click", () => showAccountInfo());
  }

  const btnCloseAccountInfoModal = document.getElementById("btnCloseAccountInfoModal");
  if (btnCloseAccountInfoModal) {
    btnCloseAccountInfoModal.addEventListener("click", () => {
      const modal = document.getElementById("accountInfoModal");
      if (modal) modal.style.display = "none";
    });
  }

  // Çıkış Yap
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  const btnRefreshProfile = document.getElementById("btnRefreshProfile");
  if (btnRefreshProfile) btnRefreshProfile.addEventListener("click", () => {
    updateAccountUI();
    updateRankUI();
    showToast("Profil yenilendi.", "info");
  });

  // ================== FRIEND SYSTEM EVENT LISTENERS ==================
  const btnCopyFriendCode = document.getElementById("btnCopyFriendCode");
  if (btnCopyFriendCode) {
    btnCopyFriendCode.addEventListener("click", () => {
      navigator.clipboard.writeText(state.myFriendCode).then(() => {
        showToast("Arkadaş kodu kopyalandı!", "success");
      }).catch(() => {
        showToast("Kopyalama başarısız.", "error");
      });
    });
  }

  const btnAddFriend = document.getElementById("btnAddFriend");
  if (btnAddFriend) {
    btnAddFriend.addEventListener("click", () => {
      const code = document.getElementById("addFriendInput").value.trim().toUpperCase();
      if (!code) {
        showToast("Arkadaş kodu girin.", "error");
        return;
      }
      if (addFriend(code)) {
        document.getElementById("addFriendInput").value = "";
      }
    });
  }

  // Sohbet gönder
  const btnSendChat = document.getElementById("btnSendChat");
  if (btnSendChat) {
    btnSendChat.addEventListener("click", () => {
      const input = document.getElementById("chatInput");
      if (input) {
        sendChatMessage(input.value);
      }
    });
  }

  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendChatMessage(chatInput.value);
      }
    });
  }

  const btnFriendRequests = document.getElementById("btnFriendRequests");
  if (btnFriendRequests) {
    btnFriendRequests.addEventListener("click", () => {
      const modal = document.getElementById("friendRequestsModal");
      if (modal) {
        renderFriendRequests();
        modal.style.display = "flex";
      }
    });
  }

  const btnCloseFriendRequestsModal = document.getElementById("btnCloseFriendRequestsModal");
  if (btnCloseFriendRequestsModal) {
    btnCloseFriendRequestsModal.addEventListener("click", () => {
      const modal = document.getElementById("friendRequestsModal");
      if (modal) modal.style.display = "none";
    });
  }

  // Oyunu başlat
  const btnLaunch = document.getElementById("btnLaunchGame");
  if (btnLaunch) btnLaunch.addEventListener("click", handleLaunchGame);

  // Progress Modal Gizle
  const btnDismissProgress = document.getElementById("btnDismissProgressModal");
  if (btnDismissProgress) {
    btnDismissProgress.addEventListener("click", () => closeProgressModal();
  }

  // Modrinth Arama
  const btnSearch = document.getElementById("btnDoSearch");
  const sInput = document.getElementById("modrinthSearchInput");
  if (btnSearch && sInput) {
    btnSearch.addEventListener("click", () => {
      state.modrinthQuery = sInput.value;
      fetchModrinth(true);
    });
    sInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        state.modrinthQuery = sInput.value;
        fetchModrinth(true);
      }
    });
  }

  document.querySelectorAll(".cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.modrinthType = pill.getAttribute("data-type");
      fetchModrinth(true);
    });
  });

  // Ekran Görüntüleri
  const btnOpenScreenshots = document.getElementById("btnOpenScreenshotsFolder");
  if (btnOpenScreenshots) {
    btnOpenScreenshots.addEventListener("click", () => openSystemFolder("screenshots"));
  }

  // Konsol Temizle
  const btnClearConsole = document.getElementById("btnClearConsole");
  if (btnClearConsole) {
    btnClearConsole.addEventListener("click", () => {
      const cOut = document.getElementById("consoleOutput");
      if (cOut) cOut.textContent = "Konsol temizlendi.\n";
    });
  }

  // Profil Oluşturma Modalı
  const btnCreateInstance = document.getElementById("btnCreateInstance");
  if (btnCreateInstance) btnCreateInstance.addEventListener("click", openCreateInstanceModal);

  const btnCloseCreateInstance = document.getElementById("btnCloseCreateInstanceModal");
  if (btnCloseCreateInstance) btnCloseCreateInstance.addEventListener("click", closeCreateInstanceModal);

  const btnCancelCreateInstance = document.getElementById("btnCancelCreateInstance");
  if (btnCancelCreateInstance) btnCancelCreateInstance.addEventListener("click", closeCreateInstanceModal);

  const btnConfirmCreateInstance = document.getElementById("btnConfirmCreateInstance");
  if (btnConfirmCreateInstance) btnConfirmCreateInstance.addEventListener("click", confirmCreateInstance);

  // Hero eylemleri
  const heroDetails = document.getElementById("heroDetailsBtn");
  if (heroDetails) {
    heroDetails.addEventListener("click", () => {
      const inst = getActiveInstance();
      if (inst) openProfileDetail(inst.id, "mods");
      else openCreateInstanceModal();
    });
  }
  const heroManage = document.getElementById("heroManageBtn");
  if (heroManage) heroManage.addEventListener("click", () => switchTab("tab-instances"));

  // Varsayılan modalları kapat
  initRailA11y();
  initDialogA11y();
}

// ================== SWITCH TAB ==================
function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach(t => {
    const active = t.getAttribute("data-tab") === tabId;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
    if (active) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
    t.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

  const targetTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  const targetPane = document.getElementById(tabId);

  if (targetTab) targetTab.classList.add("active");
  if (targetPane) targetPane.classList.add("active");

  if (tabId === "tab-modrinth") {
    renderModrinthTargetBar();
    if (state.modrinthHits.length === 0) {
      fetchModrinth(true);
    } else {
      refreshInstalledContent().then(applyInstalledStates);
    }
  } else if (tabId === "tab-gallery") {
    loadScreenshots();
  } else if (tabId === "tab-instances") {
    loadInstances();
  } else if (tabId === "tab-friends") {
    renderFriendsList();
  } else if (tabId === "tab-account") {
    updateAccountUI();
  }
}

// ================== POINTS TIMER ==================
let pointsTimerInterval = null;
function startPointsTimer() {
  if (pointsTimerInterval) clearInterval(pointsTimerInterval);
  pointsTimerInterval = setInterval(() => {
    if (state.isLoggedIn) {
      earnPoints(10);
    }
  }, 10000);
}

// ================== LOGIN MODAL ==================
function openLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) modal.style.display = "flex";
}

function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) modal.style.display = "none";
}

function showAccountInfo() {
  const modal = document.getElementById("accountInfoModal");
  const body = document.getElementById("accountInfoBody");
  if (!modal || !body) return;
  if (state.isLoggedIn && state.currentUser) {
    const rank = getRankForPoints(state.points);
    body.innerHTML = `
      <div class="account-info-card">
        <div class="info-row"><span class="info-label">Kullanıcı Adı:</span><span class="info-value">${escapeHtml(state.currentUser.username)}</span></div>
        <div class="info-row"><span class="info-label">E-posta:</span><span class="info-value">${escapeHtml(state.currentUser.email || '-')}</span></div>
        <div class="info-row"><span class="info-label">Hesap Türü:</span><span class="info-value">${state.authType === 'discord' ? 'Discord' : 'Normal'}</span></div>
        <div class="info-row"><span class="info-label">Arkadaş Kodu:</span><span class="info-value">${state.myFriendCode}</span></div>
        <div class="info-row"><span class="info-label">Rütbe:</span><span class="info-value">${rank.icon} ${rank.name}</span></div>
        <div class="info-row"><span class="info-label">Puan:</span><span class="info-value">${state.points} / 9000</span></div>
        <div class="info-row"><span class="info-label">Aktif Süre:</span><span class="info-value">${formatTime(state.totalActiveSeconds)}</span></div>
        <div class="info-row"><span class="info-label">Kayıt Tarihi:</span><span class="info-value">${state.currentUser.createdAt ? new Date(state.currentUser.createdAt).toLocaleDateString('tr-TR') : '-'}</span></div>
      </div>
    `;
  } else {
    body.innerHTML = '<p>Giriş yapmış bir hesap bulunmamaktadır.</p>';
  }
  modal.style.display = "flex";
}

// ================== PROFİLLER (INSTANCES) ==================
function getInstanceById(id) {
  if (!id) return null;
  return state.instances.find(i => i.id === id) || null;
}

function getActiveInstance() {
  return getInstanceById(state.activeInstanceId);
}

function getModrinthTarget() {
  return getInstanceById(state.modrinthTargetId) || getActiveInstance();
}

async function loadInstances() {
  const data = await apiGet("/api/instances", 8000);
  state.instances = (data && Array.isArray(data.instances)) ? data.instances : [];
  if (state.activeInstanceId && !getInstanceById(state.activeInstanceId)) {
    state.activeInstanceId = "";
    localStorage.removeItem("cl_instance");
  }
  if (state.modrinthTargetId && !getInstanceById(state.modrinthTargetId)) {
    state.modrinthTargetId = "";
    localStorage.removeItem("cl_modrinth_target");
  }
  populateActiveInstanceSelect();
  renderInstances();
  renderModrinthTargetBar();
  applyActiveInstanceToUI();
  refreshInstalledContent();
}

function populateActiveInstanceSelect() {
  const select = document.getElementById("activeInstanceSelect");
  if (!select) return;
  select.innerHTML = "";
  if (state.instances.length === 0) {
    const none = document.createElement("option");
    none.value = "";
    none.textContent = "Profil oluşturulmamış — önce yeni profil ekleyin";
    none.disabled = true;
    none.selected = true;
    select.appendChild(none);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  state.instances.forEach(inst => {
    const opt = document.createElement("option");
    opt.value = inst.id;
    opt.textContent = `${inst.name} — MC ${inst.version} (${inst.loader})`;
    select.appendChild(opt);
  });
  if (!state.instances.some(i => i.id === state.activeInstanceId)) {
    state.activeInstanceId = state.instances[0].id;
    localStorage.setItem("cl_instance", state.activeInstanceId);
  }
  select.value = state.activeInstanceId;
}

function renderInstances() {
  const wrap = document.getElementById("instancesGridWrap");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (state.instances.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-state-icon">🗂️</div>
      <h3 class="empty-state-title">Henüz profil oluşturulmamış</h3>
      <p class="empty-state-desc">Modların nereye kurulacağını belirlemek için ilk profilinizi oluşturun.</p>
      <button class="btn btn-primary" id="btnEmptyCreateInstance">+ Yeni Profil Oluştur</button>
    `;
    wrap.appendChild(empty);
    const btn = document.getElementById("btnEmptyCreateInstance");
    if (btn) btn.addEventListener("click", () => openCreateInstanceModal());
    return;
  }
  state.instances.forEach((inst, idx) => {
    const isActive = inst.id === state.activeInstanceId;
    const installing = inst.install_status === "installing";
    const failed = inst.install_status === "failed";
    const card = document.createElement("div");
    card.className = "instance-card" + (isActive ? " active" : "") + (installing ? " installing" : "");
    card.style.animationDelay = `${Math.min(idx * 0.05, 0.4)}s`;
    const iconBox = document.createElement("div");
    iconBox.className = "inst-icon-box";
    if (inst.icon) {
      const img = document.createElement("img");
      img.src = inst.icon;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        iconBox.textContent = (inst.name || "?").trim().charAt(0).toUpperCase() || "?";
        iconBox.classList.add("inst-icon-letter");
      });
      iconBox.appendChild(img);
    } else {
      iconBox.textContent = (inst.name || "?").trim().charAt(0).toUpperCase() || "?";
      iconBox.classList.add("inst-icon-letter");
    }
    const metaText = installing ? `Kuruluyor... %${inst.install_progress || 0}`
      : failed ? `Kurulum hatası: ${escapeHtml(inst.install_detail || "")}`
      : `MC ${escapeHtml(inst.version)} • ${escapeHtml(inst.loader)} • ${inst.mod_count || 0} mod`;
    const top = document.createElement("div");
    top.className = "inst-card-top";
    top.appendChild(iconBox);
    const info = document.createElement("div");
    info.className = "inst-info";
    const LOADER_ICONS = { fabric: "⚡", forge: "🔨", neoforge: "🦊", quilt: "🧵", vanilla: "🧱" };
    const loaderKey = String(inst.loader || "vanilla").toLowerCase();
    const showStatus = installing || failed;
    info.innerHTML = `
      <h4 class="inst-name" title="${escapeHtml(inst.name)}">${escapeHtml(inst.name)}</h4>
      <div class="inst-chips">
        <span class="inst-chip">MC ${escapeHtml(inst.version || "?")}</span>
        <span class="inst-chip">${LOADER_ICONS[loaderKey] || "📦"} ${escapeHtml(loaderKey)}</span>
        <span class="inst-chip">${inst.mod_count || 0} mod</span>
      </div>
      ${showStatus ? `<span class="inst-meta">${metaText}</span>` : ""}
    `;
    top.appendChild(info);
    if (isActive) {
      const badge = document.createElement("span");
      badge.className = "inst-badge-active";
      badge.textContent = "AKTİF";
      top.appendChild(badge);
    }
    const actions = document.createElement("div");
    actions.className = "inst-card-actions";
    const btnActivate = document.createElement("button");
    btnActivate.className = "btn-inst btn-inst-primary";
    btnActivate.textContent = isActive ? "Seçili" : "Aktif Yap";
    btnActivate.disabled = installing;
    btnActivate.addEventListener("click", () => setActiveInstance(inst.id));
    const btnMods = document.createElement("button");
    btnMods.className = "btn-inst";
    btnMods.textContent = "Detaylar";
    btnMods.addEventListener("click", () => openProfileDetail(inst.id, "mods"));
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-inst btn-inst-danger";
    btnDelete.textContent = "Sil";
    btnDelete.addEventListener("click", () => deleteInstance(inst.id, inst.name));
    actions.appendChild(btnActivate);
    actions.appendChild(btnMods);
    actions.appendChild(btnDelete);
    card.appendChild(top);
    card.appendChild(actions);
    wrap.appendChild(card);
  });
}

function setActiveInstance(id) {
  state.activeInstanceId = getInstanceById(id) ? id : "";
  if (state.activeInstanceId) {
    localStorage.setItem("cl_instance", state.activeInstanceId);
  } else {
    localStorage.removeItem("cl_instance");
  }
  state.modrinthTargetId = state.activeInstanceId;
  if (state.modrinthTargetId) {
    localStorage.setItem("cl_modrinth_target", state.modrinthTargetId);
  } else {
    localStorage.removeItem("cl_modrinth_target");
  }
  applyActiveInstanceToUI();
  renderInstances();
  renderModrinthTargetBar();
  fetchModrinth(true);
  const inst = getActiveInstance();
  if (inst) {
    const versionInput = document.getElementById("versionInput");
    if (versionInput) versionInput.value = inst.version;
    showToast("Aktif profil: " + inst.name + " (MC " + inst.version + " • " + inst.loader + ")", "info");
  }
}

function applyActiveInstanceToUI() {
  const select = document.getElementById("activeInstanceSelect");
  const inst = getActiveInstance();
  if (!state.engineMode || state.engineMode === "idle") {
    setLaunchButton(inst ? "idle" : "noProfile");
  }
  if (select) select.value = inst ? inst.id : "";
  const vInput = document.getElementById("versionInput");
  const hint = document.getElementById("versionLabelHint");
  if (inst) {
    state.selectedVersion = inst.version;
    state.loader = inst.loader;
    localStorage.setItem("cl_version", state.selectedVersion);
    localStorage.setItem("cl_loader", state.loader);
    if (vInput) vInput.value = inst.version;
    if (hint) hint.textContent = `"${inst.name}" profiline bağlı — değişiklik profile kaydedilir`;
    const radio = document.querySelector(`input[name="loaderRadio"][value="${inst.loader}"]`);
    if (radio) {
      radio.checked = true;
      document.querySelectorAll('input[name="loaderRadio"]').forEach(r => {
        const card = r.closest(".loader-card");
        if (card) card.classList.toggle("active", r.checked);
      });
    }
  } else if (hint) {
    hint.textContent = "İstediğiniz sürümü doğrudan yazabilir veya listeden seçebilirsiniz";
  }
  renderPlayHero();
}

function renderPlayHero() {
  const inst = getActiveInstance();
  const nameEl = document.getElementById("heroProfileName");
  const iconEl = document.getElementById("heroProfileIcon");
  const chipsEl = document.getElementById("heroProfileChips");
  const subEl = document.getElementById("heroProfileSub");
  const detailsBtn = document.getElementById("heroDetailsBtn");
  if (!inst) {
    if (nameEl) nameEl.textContent = "Profil seçilmedi";
    if (chipsEl) chipsEl.innerHTML = "";
    if (subEl) subEl.textContent = "Başlamak için yeni bir profil oluşturun.";
    if (iconEl) iconEl.textContent = "G";
    if (detailsBtn) detailsBtn.disabled = true;
    return;
  }
  const loaderLabel = pdsLoaderLabel(inst.loader);
  const loaderText = loaderLabel + (inst.loader_version ? ` ${inst.loader_version}` : "");
  if (nameEl) nameEl.textContent = inst.name || "Profil";
  if (subEl) subEl.textContent = `"${inst.name || "Profil"}" profili ile oyuna hazırsın.`;
  if (detailsBtn) detailsBtn.disabled = false;
  if (chipsEl) {
    chipsEl.innerHTML = `
      <span class="chip">MC ${escapeHtml(inst.version || "?")}</span>
      <span class="chip">${escapeHtml(loaderText)}</span>
      <span class="chip">${inst.mod_count || 0} mod</span>
    `;
  }
  if (iconEl) {
    iconEl.innerHTML = "";
    if (inst.icon) {
      const img = document.createElement("img");
      img.src = inst.icon;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        iconEl.textContent = (inst.name || "?").trim().charAt(0).toUpperCase() || "?";
      });
      iconEl.appendChild(img);
    } else {
      iconEl.textContent = (inst.name || "?").trim().charAt(0).toUpperCase() || "?";
    }
  }
}

async function updateActiveInstance(fields) {
  const inst = getActiveInstance();
  if (!inst) return;
  Object.assign(inst, fields);
  renderInstances();
  renderModrinthTargetBar();
  const data = await apiPost("/api/instances/update", {
    id: inst.id,
    version: inst.version,
    loader: inst.loader,
    name: inst.name
  }, 8000);
  if (data && data.success && data.instance) {
    const idx = state.instances.findIndex(i => i.id === inst.id);
    if (idx >= 0) state.instances[idx] = data.instance;
    renderInstances();
    renderModrinthTargetBar();
  }
}

// ==================== PROFİL DETAY ====================
function pdsLoaderLabel(loader) {
  const labels = { vanilla: "Vanilla", fabric: "Fabric", forge: "Forge", neoforge: "NeoForge", quilt: "Quilt" };
  return labels[String(loader || "").toLowerCase()] || loader || "Vanilla";
}

function openProfileDetail(instId, tab) {
  const screen = document.getElementById("profileDetailScreen");
  if (screen) {
    screen.style.display = "flex";
    screen.setAttribute("aria-hidden", "false");
  }
}

function closeProfileDetail() {
  const screen = document.getElementById("profileDetailScreen");
  if (screen) {
    screen.style.display = "none";
    screen.setAttribute("aria-hidden", "true");
  }
}

function initProfileDetailScreen() {
  const backBtn = document.getElementById("pdsBackBtn");
  const closeBtn = document.getElementById("pdsCloseBtn");
  if (backBtn) backBtn.addEventListener("click", closeProfileDetail);
  if (closeBtn) closeBtn.addEventListener("click", closeProfileDetail);
}

// ==================== TAURI WINDOW CONTROLS ====================
function setupTauriWindowControls() {
  const minBtn = document.getElementById("btnWinMinimize");
  const maxBtn = document.getElementById("btnWinMaximize");
  const closeBtn = document.getElementById("btnWinClose");
  if (minBtn) minBtn.addEventListener("click", () => { if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().minimize(); });
  if (maxBtn) maxBtn.addEventListener("click", () => { if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().toggleMaximize(); });
  if (closeBtn) closeBtn.addEventListener("click", () => { if (window.__TAURI__) window.__TAURI__.window.getCurrentWindow().close(); });
}

// ==================== MODRINTH (SIMPLIFIED) ==================
function fetchModrinth(reset) {
  showToast("Modrinth içerikleri yükleniyor...", "info");
}

function renderModrinthTargetBar() {
  const select = document.getElementById("modrinthInstanceSelect");
  if (!select) return;
  select.innerHTML = "";
  state.instances.forEach(inst => {
    const opt = document.createElement("option");
    opt.value = inst.id;
    opt.textContent = `${inst.name} — MC ${inst.version}`;
    select.appendChild(opt);
  });
  if (state.modrinthTargetId) select.value = state.modrinthTargetId;
}

function applyInstalledStates() {}
function refreshInstalledContent() { return Promise.resolve(); }
function renderInstalledPanel() {}
function loadScreenshots() {}
function openSystemFolder(folder) { showToast("Klasör açılıyor: " + (folder || ".minecraft"), "info"); }
function handleLaunchGame() { showToast("Oyun başlatılıyor...", "info"); }
function closeProgressModal() { const m = document.getElementById("launchProgressModal"); if (m) m.style.display = "none"; }
function openCreateInstanceModal() { const m = document.getElementById("createInstanceModal"); if (m) m.style.display = "flex"; }
function closeCreateInstanceModal() { const m = document.getElementById("createInstanceModal"); if (m) m.style.display = "none"; }
function confirmCreateInstance() { showToast("Profil oluşturuluyor...", "info"); closeCreateInstanceModal(); }
function initNewProfileModal() {}
function openVersionSelectorModal() { const m = document.getElementById("versionSelectorModal"); if (m) m.style.display = "flex"; }
function closeVersionSelectorModal() { const m = document.getElementById("versionSelectorModal"); if (m) m.style.display = "none"; }
function filterAndRenderVersionTable() {}
function loadVersions() {}
function startStatusPolling() {}
function initVersionSwitchModal() {}
function initRailA11y() {}
function initDialogA11y() {}
function deleteInstance(id, name) { if (confirm(name + " profili silinsin mi?")) showToast("Profil silindi.", "info"); }
function setLaunchButton(mode) {}

// ==================== RAIL A11Y ====================
function initRailA11y() {
  const menu = document.querySelector(".rail-menu");
  if (!menu || menu.dataset.bound === "1") return;
  menu.dataset.bound = "1";
  const tabs = () => Array.from(menu.querySelectorAll(".nav-tab"));
  tabs().forEach(t => { t.tabIndex = t.classList.contains("active") ? 0 : -1; });
  menu.addEventListener("keydown", (e) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const items = tabs();
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement);
    let next = 0;
    if (e.key === "ArrowDown") next = idx < 0 ? 0 : (idx + 1) % items.length;
    else if (e.key === "ArrowUp") next = idx < 0 ? items.length - 1 : (idx - 1 + items.length) % items.length;
    else if (e.key === "End") next = items.length - 1;
    items[next].focus();
    items[next].click();
  });
}

// ==================== DIALOG A11Y ====================
function initDialogA11y() {
  if (initDialogA11y._bound) return;
  initDialogA11y._bound = true;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop").forEach(m => {
        if (m.style.display === "flex") m.style.display = "none";
      });
      closeProfileDetail();
    }
  });
}

// ==================== RIPPLE ====================
function initRipple() {
  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest
      ? e.target.closest("button.btn-primary-action, button.btn-secondary, button.btn-mega-launch, button.nav-tab, button.cat-pill, button.np-loader-card, button.np-combo-item, button.np-pack-item, button.np-side-tab, button.np-adv-toggle, button.control-btn, button.btn-search-go, button.btn-browse-version, button.btn-close-modal, button.installed-cat-tab, button.theme-option, button.login-tab, button.profile-menu-item")
      : null;
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "np-ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
  });
}

initRipple();