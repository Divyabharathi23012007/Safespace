/* ─── LOADING SCREEN ─── */
window.onload = function(){
  setTimeout(function(){
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("mainContent").style.display  = "block";
  }, 4000);
  buildDiscreetCalendar();
  setInterval(updateDateTime, 1000);
};

document.addEventListener("keydown", e => { if(e.key === "Escape") quickExit(); });

/* ═══ QUICK EXIT ═══ */
function quickExit(){
  document.getElementById("exitFlash").style.display = "flex";
  setTimeout(() => window.location.replace("https://www.google.com/search?q=weather+today"), 300);
}

/* ═══ DISCREET MODE ═══ */
let discreetActive = false;
function toggleDiscreetMode(){
  discreetActive = !discreetActive;
  const ids = ["mainContent","loadingScreen","userChatApp","adminDashboard"];
  ids.forEach(id => { const el=document.getElementById(id); if(el) el.style.display="none"; });
  if(discreetActive){
    document.getElementById("discreetApp").classList.remove("hidden");
    document.getElementById("discreetApp").style.display = "flex";
    document.getElementById("pageTitle").innerText = "WorkDesk Pro — Dashboard";
    document.getElementById("pageFavicon").href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>";
    document.body.style.background = "#f3f4f6";
    document.getElementById("safetyBar").classList.add("discreet-bar");
    document.getElementById("discreetBtn").innerHTML = "🌸 My Portal";
  } else {
    document.getElementById("discreetApp").style.display = "none";
    document.getElementById("discreetApp").classList.add("hidden");
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("pageTitle").innerText = "SafeSpace Portal";
    document.getElementById("pageFavicon").href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>";
    document.body.style.background = "";
    document.getElementById("safetyBar").classList.remove("discreet-bar");
    document.getElementById("discreetBtn").innerHTML = "🕵️ Discreet Mode";
  }
}
function switchDiscreetTab(tab){
  document.querySelectorAll(".d-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".d-tab").forEach(el => el.classList.remove("active"));
  document.getElementById("discreet-"+tab).classList.remove("hidden");
  event.target.classList.add("active");
}
function buildDiscreetCalendar(){
  const grid = document.getElementById("discreetCalGrid");
  if(!grid) return;
  let html = "";
  for(let i=0;i<6;i++) html += `<div class="d-cal-day empty"></div>`;
  for(let d=1;d<=31;d++){
    const today = d===6?"today":"";
    const has   = [6,10,14,20,25].includes(d)?"has-event":"";
    html += `<div class="d-cal-day ${today} ${has}">${d}</div>`;
  }
  grid.innerHTML = html;
}

/* ═══ NAVIGATION ═══ */
function show(id){ const el=document.getElementById(id); el.style.display="block"; el.classList.remove("hidden"); }
function hide(id){ document.getElementById(id).style.display="none"; }
function openRegister(){ hide("homePage"); show("registerSection"); }
function openTrack(){ hide("homePage"); show("trackSection"); }
function openMessaging(){ hide("homePage"); show("messagingGateway"); }
function goHome(){
  ["registerSection","trackSection","messagingGateway","userLoginSection"].forEach(hide);
  show("homePage");
}
function backToGateway(){ hide("userLoginSection"); show("messagingGateway"); }

/* ═══ COMPLAINT FORM ═══ */
document.getElementById("complaintForm").addEventListener("submit", async function(e){
  e.preventDefault();
  const formData = new FormData();
  formData.append("complaint", document.getElementById("complaint").value);
  formData.append("person",    document.getElementById("person").value);
  formData.append("proof",     document.getElementById("proof").files[0]);
  const res  = await fetch("/submit-complaint",{ method:"POST", body:formData });
  const data = await res.json();
  document.getElementById("result").innerHTML =
    `✅ Complaint submitted! <br><strong>Your Complaint ID:</strong> <span class="complaint-id-text">${data.complaintId}</span>
     <button class="copy-id-btn" onclick="copyId('${data.complaintId}')">📋 Copy ID</button>`;
});

function copyId(id){
  navigator.clipboard.writeText(id).then(() => {
    const btn = document.querySelector(".copy-id-btn");
    btn.innerText = "✅ Copied!";
    setTimeout(() => btn.innerText = "📋 Copy ID", 2000);
  });
}

/* ═══ TRACK ═══ */
async function trackComplaint(){
  const id   = document.getElementById("trackId").value;
  const res  = await fetch("/track/"+id);
  const data = await res.json();
  if(data.message){ document.getElementById("trackResult").innerText = data.message; return; }
  const statusClass = { Pending:"badge-pending", "In Review":"badge-inreview", Resolved:"badge-resolved", Rejected:"badge-rejected" }[data.status] || "";
  document.getElementById("trackResult").innerHTML = `
    <div class="track-card">
      <div class="track-row"><span class="track-label">Complaint</span><span>${escapeHtml(data.complaint)}</span></div>
      <div class="track-row"><span class="track-label">Person</span><span>${escapeHtml(data.person||"—")}</span></div>
      <div class="track-row"><span class="track-label">Status</span><span class="status-badge ${statusClass}">${data.status}</span></div>
      <div class="track-row"><span class="track-label">AI Check</span><span class="ai-badge ${data.ai_verification==="Suspicious"?"ai-suspicious":"ai-valid"}">${data.ai_verification||"—"}</span></div>
      <div class="track-row"><span class="track-label">Date</span><span>${new Date(data.date).toLocaleString("en-IN")}</span></div>
    </div>`;
}

/* ════════════════════════════════════
   ADMIN LOGIN
════════════════════════════════════ */
let adminLoginTarget = "dashboard"; // 'dashboard' or 'messaging'
let loginAttempts    = 0;
const MAX_ATTEMPTS   = 5;

function openAdminLogin(target = "dashboard"){
  adminLoginTarget = target;
  loginAttempts    = 0;
  document.getElementById("adminPasswordInput").value = "";
  document.getElementById("adminLoginError").innerText = "";
  document.getElementById("attemptsMsg").innerText     = "";
  document.getElementById("adminLoginModal").style.display = "flex";
  setTimeout(() => document.getElementById("adminPasswordInput").focus(), 100);
}

function closeAdminLogin(){
  document.getElementById("adminLoginModal").style.display = "none";
}

function togglePasswordVisibility(){
  const inp = document.getElementById("adminPasswordInput");
  inp.type  = inp.type === "password" ? "text" : "password";
  document.getElementById("eyeBtn").innerText = inp.type === "password" ? "👁️" : "🙈";
}

async function submitAdminLogin(){
  const password = document.getElementById("adminPasswordInput").value;
  if(!password){ document.getElementById("adminLoginError").innerText = "Please enter the password."; return; }

  const res  = await fetch("/admin/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ password }) });
  const data = await res.json();

  if(data.success){
    closeAdminLogin();
    if(adminLoginTarget === "messaging"){
      openAdminMessaging();
    } else {
      openAdminDashboard();
    }
  } else {
    loginAttempts++;
    const remaining = MAX_ATTEMPTS - loginAttempts;
    document.getElementById("adminLoginError").innerText = "❌ Incorrect password.";
    if(remaining > 0){
      document.getElementById("attemptsMsg").innerText = `${remaining} attempt${remaining>1?"s":""} remaining`;
    } else {
      document.getElementById("adminLoginError").innerText = "🔒 Too many failed attempts. Please try again later.";
      document.getElementById("adminPasswordInput").disabled = true;
      document.querySelector(".modal-submit").disabled = true;
      setTimeout(() => {
        document.getElementById("adminPasswordInput").disabled = false;
        document.querySelector(".modal-submit").disabled = false;
        loginAttempts = 0;
        document.getElementById("attemptsMsg").innerText = "";
        document.getElementById("adminLoginError").innerText = "";
      }, 30000);
    }
    document.getElementById("adminPasswordInput").value = "";
  }
}

/* ════════════════════════════════════
   ADMIN DASHBOARD
════════════════════════════════════ */
let allComplaints = [];
let currentStatusId = null;
let adminDashPollInterval = null;

function openAdminDashboard(){
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("adminDashboard").style.display = "flex";
  switchAdminTab("overview");
  loadAdminData();
  startQuoteRotation();
  if(!adminDashPollInterval) adminDashPollInterval = setInterval(loadAdminData, 8000);
}

function adminLogout(){
  clearInterval(adminDashPollInterval);
  clearInterval(adminPollInterval);
  adminDashPollInterval = null;
  adminPollInterval     = null;
  allComplaints = [];
  document.getElementById("adminDashboard").style.display = "none";
  document.getElementById("mainContent").style.display    = "block";
  goHome();
}

function switchAdminTab(tab){
  document.querySelectorAll(".adm-tab").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".adm-menu-item").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-"+tab).classList.remove("hidden");
  document.getElementById("nav-"+tab).classList.add("active");
  if(tab === "messages"){
    loadAdminThreads();
  }
}

async function loadAdminData(){
  const res  = await fetch("/admin/complaints");
  const data = await res.json();
  allComplaints = data.complaints || [];
  const s = data.stats;
  document.getElementById("stat-total").innerText     = s.total;
  document.getElementById("stat-pending").innerText   = s.pending;
  document.getElementById("stat-inreview").innerText  = s.inReview;
  document.getElementById("stat-resolved").innerText  = s.resolved;
  document.getElementById("stat-rejected").innerText  = s.rejected;
  document.getElementById("stat-suspicious").innerText= s.suspicious;
  document.getElementById("pendingBadge").innerText   = s.pending;
  document.getElementById("pendingBadge").style.display = s.pending > 0 ? "flex" : "none";

  // Progress bars
  const total = s.total || 1;
  const setProgress = (id, val) => {
    const pct = Math.round((val/total)*100);
    const el = document.getElementById("prog-"+id);
    const pe = document.getElementById("pct-"+id);
    if(el) el.style.width = pct + "%";
    if(pe) pe.innerText = pct + "%";
  };
  setProgress("resolved", s.resolved);
  setProgress("inreview", s.inReview);
  setProgress("pending",  s.pending);
  setProgress("rejected", s.rejected);
  renderRecentComplaints();
  renderComplaintsTable(allComplaints);

  // Unread message badge
  const msgRes = await fetch("/messages/admin/unread-count");
  const msgData = await msgRes.json();
  const mb = document.getElementById("msgBadge");
  if(msgData.count > 0){ mb.innerText = msgData.count; mb.style.display="flex"; }
  else mb.style.display = "none";
}

function renderRecentComplaints(){
  const recent = [...allComplaints].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,5);
  const container = document.getElementById("recentComplaints");
  if(!recent.length){ container.innerHTML = `<div class="adm-empty">No complaints yet.</div>`; return; }
  container.innerHTML = recent.map(c => `
    <div class="adm-recent-item" onclick="openDetailModal('${c.id}')">
      <div class="adm-recent-left">
        <div class="adm-recent-person">${escapeHtml(c.person||"Anonymous")}</div>
        <div class="adm-recent-text">${escapeHtml(c.complaint.substring(0,70))}${c.complaint.length>70?"...":""}</div>
      </div>
      <div class="adm-recent-right">
        <span class="status-badge ${statusClass(c.status)}">${c.status}</span>
        <div class="adm-recent-date">${new Date(c.date).toLocaleDateString("en-IN")}</div>
      </div>
    </div>`).join("");
}

function renderComplaintsTable(complaints){
  const tbody = document.getElementById("complaintsTableBody");
  const empty = document.getElementById("noComplaintsMsg");
  if(!complaints.length){ tbody.innerHTML=""; empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");
  tbody.innerHTML = complaints.map(c => `
    <tr>
      <td><span class="id-cell" title="${c.id}">${c.id.substring(0,8)}...</span></td>
      <td>${escapeHtml(c.person||"—")}</td>
      <td class="complaint-cell">${escapeHtml(c.complaint.substring(0,60))}${c.complaint.length>60?"...":""}</td>
      <td>${new Date(c.date).toLocaleDateString("en-IN")}</td>
      <td><span class="ai-badge ${c.ai_verification==="Suspicious"?"ai-suspicious":"ai-valid"}">${c.ai_verification||"—"}</span></td>
      <td><span class="status-badge ${statusClass(c.status)}">${c.status}</span></td>
      <td class="action-cell">
        <button class="adm-btn view-btn"  onclick="openDetailModal('${c.id}')">👁️</button>
        <button class="adm-btn edit-btn"  onclick="openStatusModal('${c.id}')">✏️</button>
        <button class="adm-btn del-btn"   onclick="deleteComplaint('${c.id}')">🗑️</button>
      </td>
    </tr>`).join("");
}

function filterComplaints(){
  const q      = document.getElementById("complaintSearch").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const ai     = document.getElementById("aiFilter").value;
  const filtered = allComplaints.filter(c =>
    (c.complaint.toLowerCase().includes(q) || (c.person||"").toLowerCase().includes(q) || c.id.includes(q)) &&
    (!status || c.status === status) &&
    (!ai     || c.ai_verification === ai)
  );
  renderComplaintsTable(filtered);
}

/* Status modal */
function openStatusModal(id){
  currentStatusId = id;
  document.getElementById("statusModalId").innerText = "Complaint: " + id.substring(0,16) + "...";
  document.getElementById("statusModal").style.display = "flex";
}
function closeStatusModal(){ document.getElementById("statusModal").style.display = "none"; }
async function setStatus(status){
  await fetch("/admin/update-status",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id:currentStatusId, status }) });
  closeStatusModal();
  loadAdminData();
}

/* Detail modal */
function openDetailModal(id){
  const c = allComplaints.find(x => x.id === id);
  if(!c) return;
  document.getElementById("detailContent").innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-label">Complaint ID</span><span class="detail-val mono">${c.id}</span></div>
      <div class="detail-row"><span class="detail-label">Person Involved</span><span class="detail-val">${escapeHtml(c.person||"—")}</span></div>
      <div class="detail-row full"><span class="detail-label">Complaint</span><span class="detail-val">${escapeHtml(c.complaint)}</span></div>
      <div class="detail-row"><span class="detail-label">Date Submitted</span><span class="detail-val">${new Date(c.date).toLocaleString("en-IN")}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="status-badge ${statusClass(c.status)}">${c.status}</span></div>
      <div class="detail-row"><span class="detail-label">AI Verification</span><span class="ai-badge ${c.ai_verification==="Suspicious"?"ai-suspicious":"ai-valid"}">${c.ai_verification||"—"}</span></div>
      <div class="detail-row"><span class="detail-label">Proof File</span><span class="detail-val">${c.proof ? `<a href="/uploads/${c.proof}" target="_blank" class="proof-link">📎 View Proof</a>` : "No proof uploaded"}</span></div>
    </div>
    <div class="detail-actions">
      <button class="status-btn inreview" onclick="closeDetailModal();openStatusModal('${c.id}')">✏️ Update Status</button>
    </div>`;
  document.getElementById("detailModal").style.display = "flex";
}
function closeDetailModal(){ document.getElementById("detailModal").style.display = "none"; }

async function deleteComplaint(id){
  if(!confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
  await fetch("/admin/delete-complaint",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id }) });
  loadAdminData();
}

/* Helpers */
function statusClass(s){ return { Pending:"badge-pending","In Review":"badge-inreview",Resolved:"badge-resolved",Rejected:"badge-rejected" }[s] || ""; }
function updateDateTime(){
  const el = document.getElementById("adminDateTime");
  if(el) el.innerText = new Date().toLocaleString("en-IN",{ weekday:"short",year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit" });
}

/* ════════════════════════════════════
   MESSAGING — ROLE SELECTION
════════════════════════════════════ */
function selectRole(role){
  if(role === "user"){
    hide("messagingGateway");
    show("userLoginSection");
    document.getElementById("userComplaintId").value = "";
    document.getElementById("userLoginError").innerText = "";
  }
}

function openAdminMessaging(){
  document.getElementById("mainContent").style.display = "none";
  openAdminDashboard();
  setTimeout(() => switchAdminTab("messages"), 100);
}

/* ════════════════════════════════════
   USER MESSAGING
════════════════════════════════════ */
let currentUserComplaintId = null;
let userPollInterval       = null;

async function userLogin(){
  const id = document.getElementById("userComplaintId").value.trim();
  if(!id){ document.getElementById("userLoginError").innerText="Please enter your Complaint ID."; return; }
  const res  = await fetch("/messages/validate/"+id);
  const data = await res.json();
  if(!data.valid){ document.getElementById("userLoginError").innerText="❌ Complaint ID not found."; return; }
  currentUserComplaintId = id;
  document.getElementById("userSidebarName").innerText = data.person || "User";
  hide("userLoginSection");
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("userChatApp").classList.remove("hidden");
  document.getElementById("userChatApp").style.display = "flex";
  loadUserMessages();
  userPollInterval = setInterval(loadUserMessages, 4000);
}

async function loadUserMessages(){
  if(!currentUserComplaintId) return;
  const res  = await fetch("/messages/user/"+currentUserComplaintId);
  const data = await res.json();
  renderUserMessages(data.messages);
  updateUserSidebar(data.messages);
}

function renderUserMessages(messages){
  const container = document.getElementById("userMessages");
  if(!messages||!messages.length){ container.innerHTML=`<div class="empty-chat"><div style="font-size:48px;margin-bottom:12px;">💬</div><p>No messages yet.</p></div>`; return; }
  let html="",lastDate="";
  messages.forEach(msg => {
    const d = new Date(msg.timestamp);
    const dateStr = d.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    if(dateStr!==lastDate){ html+=`<div class="date-divider"><span>${dateStr}</span></div>`; lastDate=dateStr; }
    const isUser = msg.sender==="user";
    const time   = d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
    html+=`<div class="msg-row ${isUser?"msg-out":"msg-in"}"><div class="msg-bubble ${isUser?"bubble-out":"bubble-in"}"><div class="msg-text">${escapeHtml(msg.text)}</div><div class="msg-meta"><span class="msg-time">${time}</span>${isUser?`<span class="msg-tick">${msg.read?"✓✓":"✓"}</span>`:""}</div></div></div>`;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function updateUserSidebar(messages){
  if(!messages||!messages.length) return;
  const last = messages[messages.length-1];
  document.getElementById("userLastMsgPreview").innerText = last.text.substring(0,40);
  document.getElementById("userLastMsgTime").innerText    = formatSidebarTime(last.timestamp);
  const unread = messages.filter(m => m.sender==="admin"&&!m.read).length;
  const badge  = document.getElementById("userUnreadBadge");
  if(unread>0){ badge.innerText=unread; badge.classList.remove("hidden"); } else badge.classList.add("hidden");
}

async function sendUserMessage(){
  const input = document.getElementById("userMsgInput");
  const text  = input.value.trim();
  if(!text) return;
  input.value = "";
  await fetch("/messages/user/send",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({complaintId:currentUserComplaintId,text}) });
  loadUserMessages();
}

function exitUserChat(){
  clearInterval(userPollInterval);
  currentUserComplaintId = null;
  document.getElementById("userChatApp").style.display="none";
  document.getElementById("userChatApp").classList.add("hidden");
  document.getElementById("mainContent").style.display="block";
  show("messagingGateway");
}

/* ════════════════════════════════════
   ADMIN MESSAGING
════════════════════════════════════ */
let currentAdminComplaintId = null;
let adminPollInterval       = null;
let allAdminThreads         = [];

async function loadAdminThreads(){
  const res  = await fetch("/messages/admin/all");
  const data = await res.json();
  allAdminThreads = data.threads || [];
  renderAdminThreads(allAdminThreads);
  if(currentAdminComplaintId) loadAdminThread(currentAdminComplaintId);
  if(!adminPollInterval) adminPollInterval = setInterval(()=>{
    fetch("/messages/admin/all").then(r=>r.json()).then(d=>{
      allAdminThreads = d.threads||[];
      renderAdminThreads(allAdminThreads);
      if(currentAdminComplaintId) loadAdminThread(currentAdminComplaintId);
    });
  }, 4000);
}

function renderAdminThreads(threads){
  const list = document.getElementById("adminChatList");
  if(!threads||!threads.length){ list.innerHTML=`<div class="empty-threads">No conversations yet.</div>`; return; }
  list.innerHTML = threads.map(t => `
    <div class="chat-list-item ${t.complaintId===currentAdminComplaintId?"active":""}" onclick="openAdminThread('${t.complaintId}')">
      <div class="cli-avatar user-avatar">${(t.person||"?").charAt(0).toUpperCase()}</div>
      <div class="cli-body">
        <div class="cli-top"><span class="cli-name">${escapeHtml(t.person)}</span><span class="cli-time">${t.lastTimestamp?formatSidebarTime(t.lastTimestamp):"—"}</span></div>
        <div class="cli-preview">${escapeHtml(t.lastMessage||"No messages")}</div>
        <div class="cli-id">ID: ${t.complaintId.substring(0,8)}...</div>
      </div>
      ${t.unreadCount>0?`<div class="unread-badge">${t.unreadCount}</div>`:""}
    </div>`).join("");
}

async function openAdminThread(complaintId){
  currentAdminComplaintId = complaintId;
  const thread = allAdminThreads.find(t => t.complaintId===complaintId);
  if(thread){
    document.getElementById("adminActiveName").innerText   = thread.person||"User";
    document.getElementById("adminActiveId").innerText     = "ID: "+complaintId.substring(0,16)+"...";
    document.getElementById("adminActiveAvatar").innerText = (thread.person||"?").charAt(0).toUpperCase();
  }
  document.getElementById("adminInputBar").style.display = "flex";
  await loadAdminThread(complaintId);
  renderAdminThreads(allAdminThreads);
}

async function loadAdminThread(complaintId){
  const res  = await fetch("/messages/admin/thread/"+complaintId);
  const data = await res.json();
  renderAdminMessages(data.messages);
}

function renderAdminMessages(messages){
  const container = document.getElementById("adminMessages");
  if(!messages||!messages.length){ container.innerHTML=`<div class="empty-chat"><div style="font-size:48px;margin-bottom:12px;">💬</div><p>No messages yet.</p></div>`; return; }
  let html="",lastDate="";
  messages.forEach(msg => {
    const d = new Date(msg.timestamp);
    const dateStr = d.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    if(dateStr!==lastDate){ html+=`<div class="date-divider"><span>${dateStr}</span></div>`; lastDate=dateStr; }
    const isAdmin = msg.sender==="admin";
    const time    = d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
    html+=`<div class="msg-row ${isAdmin?"msg-out":"msg-in"}"><div class="msg-bubble ${isAdmin?"bubble-out":"bubble-in"}"><div class="msg-sender-label">${escapeHtml(msg.senderLabel)}</div><div class="msg-text">${escapeHtml(msg.text)}</div><div class="msg-meta"><span class="msg-time">${time}</span>${isAdmin?`<span class="msg-tick">${msg.read?"✓✓":"✓"}</span>`:""}</div></div></div>`;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

async function sendAdminMessage(){
  const input = document.getElementById("adminMsgInput");
  const text  = input.value.trim();
  if(!text||!currentAdminComplaintId) return;
  input.value = "";
  await fetch("/messages/admin/send",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({complaintId:currentAdminComplaintId,text}) });
  loadAdminThread(currentAdminComplaintId);
}

function filterAdminThreads(){
  const q = document.getElementById("adminSearch").value.toLowerCase();
  renderAdminThreads(allAdminThreads.filter(t => t.person.toLowerCase().includes(q)||t.complaintId.toLowerCase().includes(q)));
}

/* ════ UTILS ════ */
function formatSidebarTime(ts){
  const d=new Date(ts),now=new Date(),diffDays=Math.floor((now-d)/86400000);
  if(diffDays===0) return d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  if(diffDays===1) return "Yesterday";
  if(diffDays<7)   return d.toLocaleDateString("en-IN",{weekday:"short"});
  return d.toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit"});
}
function escapeHtml(str){
  if(!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ════════════════════════════════════════
   QUOTES ROTATOR
════════════════════════════════════════ */
let currentQuote = 0;
const totalQuotes = 6;

function initQuoteDots(){
  const dots = document.getElementById("quoteDots");
  if(!dots) return;
  dots.innerHTML = "";
  for(let i=0;i<totalQuotes;i++){
    const d = document.createElement("div");
    d.className = "adm-quote-dot" + (i===0?" active":"");
    d.onclick = () => goToQuote(i);
    dots.appendChild(d);
  }
}

function goToQuote(n){
  document.getElementById("quote-"+currentQuote)?.classList.remove("active");
  document.querySelectorAll(".adm-quote-dot")[currentQuote]?.classList.remove("active");
  currentQuote = n;
  document.getElementById("quote-"+currentQuote)?.classList.add("active");
  document.querySelectorAll(".adm-quote-dot")[currentQuote]?.classList.add("active");
}

function startQuoteRotation(){
  initQuoteDots();
  setInterval(()=> goToQuote((currentQuote+1) % totalQuotes), 4000);
}
