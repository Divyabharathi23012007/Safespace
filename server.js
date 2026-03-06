require("dotenv").config({ path: require("path").join(__dirname, ".env") });
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ loaded" : "❌ MISSING");
console.log("ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD ? "✅ loaded" : "❌ MISSING");
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

/* CREATE FOLDERS */
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const dataDir = "./data";
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const DATA_FILE     = "./data/complaints.json";
const MESSAGES_FILE = "./data/messages.json";

/* ── ADMIN PASSWORD ── */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "safespace2026";

/* FILE UPLOAD */
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* EMAIL */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* HELPERS */
function readComplaints() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
}
function saveComplaints(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function readMessages() {
    if (!fs.existsSync(MESSAGES_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(MESSAGES_FILE)); } catch(e) { return {}; }
}
function saveMessages(data) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
}
function checkComplaint(text) {
    const badWords = ["fake","lie","stupid","idiot","hate","nonsense"];
    text = text.toLowerCase();
    for (let word of badWords) { if (text.includes(word)) return "Suspicious"; }
    return "Valid";
}

/* ══════════════════════════════
   ADMIN AUTH ROUTE
══════════════════════════════ */
app.post("/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "Incorrect password" });
    }
});

/* ══════════════════════════════
   COMPLAINT ROUTES
══════════════════════════════ */
app.post("/submit-complaint", upload.single("proof"), (req, res) => {
    const complaint = req.body.complaint;
    const person    = req.body.person;
    const proofFile = req.file ? req.file.filename : null;
    const complaints = readComplaints();
    const aiResult   = checkComplaint(complaint);
    const newComplaint = {
        id: uuidv4(), complaint, person, proof: proofFile,
        status: "Pending", ai_verification: aiResult, date: new Date()
    };
    complaints.push(newComplaint);
    saveComplaints(complaints);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to:   process.env.EMAIL_USER,
        subject: "New Complaint Registered",
        text: `Complaint ID: ${newComplaint.id}\n\nComplaint:\n${complaint}\n\nPerson:\n${person}\n\nAI Check:\n${aiResult}`,
        attachments: proofFile ? [{ filename: proofFile, path: path.join(__dirname, "uploads", proofFile) }] : []
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.log(err); else console.log("Email sent: " + info.response);
    });
    res.json({ message: "Complaint submitted successfully", complaintId: newComplaint.id });
});

app.get("/track/:id", (req, res) => {
    const complaints = readComplaints();
    const complaint  = complaints.find(c => c.id === req.params.id);
    if (!complaint) return res.json({ message: "Complaint not found" });
    res.json(complaint);
});

/* ══════════════════════════════
   ADMIN DASHBOARD ROUTES
══════════════════════════════ */

/* Get all complaints with stats */
app.get("/admin/complaints", (req, res) => {
    const complaints = readComplaints();
    const total      = complaints.length;
    const pending    = complaints.filter(c => c.status === "Pending").length;
    const inReview   = complaints.filter(c => c.status === "In Review").length;
    const resolved   = complaints.filter(c => c.status === "Resolved").length;
    const rejected   = complaints.filter(c => c.status === "Rejected").length;
    const suspicious = complaints.filter(c => c.ai_verification === "Suspicious").length;
    res.json({ complaints, stats: { total, pending, inReview, resolved, rejected, suspicious } });
});

/* Update complaint status */
app.post("/admin/update-status", (req, res) => {
    const { id, status } = req.body;
    const validStatuses = ["Pending", "In Review", "Resolved", "Rejected"];
    if (!validStatuses.includes(status)) return res.json({ success: false, error: "Invalid status" });
    const complaints = readComplaints();
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) return res.json({ success: false, error: "Complaint not found" });
    complaints[idx].status = status;
    complaints[idx].statusUpdatedAt = new Date().toISOString();
    saveComplaints(complaints);
    res.json({ success: true });
});

/* Delete a complaint */
app.post("/admin/delete-complaint", (req, res) => {
    const { id } = req.body;
    let complaints = readComplaints();
    complaints = complaints.filter(c => c.id !== id);
    saveComplaints(complaints);
    res.json({ success: true });
});

/* ══════════════════════════════
   MESSAGING ROUTES
══════════════════════════════ */
app.get("/messages/validate/:complaintId", (req, res) => {
    const complaints = readComplaints();
    const found = complaints.find(c => c.id === req.params.complaintId);
    if (!found) return res.json({ valid: false });
    res.json({ valid: true, complaint: found.complaint, person: found.person });
});

app.get("/messages/user/:complaintId", (req, res) => {
    const all    = readMessages();
    const thread = all[req.params.complaintId] || [];
    let updated  = false;
    thread.forEach(msg => { if (msg.sender === "admin" && !msg.read) { msg.read = true; updated = true; } });
    if (updated) { all[req.params.complaintId] = thread; saveMessages(all); }
    res.json({ messages: thread });
});

app.post("/messages/user/send", (req, res) => {
    const { complaintId, text } = req.body;
    if (!complaintId || !text || !text.trim()) return res.json({ success: false });
    const complaints = readComplaints();
    const found = complaints.find(c => c.id === complaintId);
    if (!found) return res.json({ success: false, error: "Invalid complaint ID" });
    const all = readMessages();
    if (!all[complaintId]) all[complaintId] = [];
    const msg = {
        id: uuidv4(), sender: "user", senderLabel: found.person || "User",
        text: text.trim(), timestamp: new Date().toISOString(), read: false
    };
    all[complaintId].push(msg);
    saveMessages(all);
    res.json({ success: true, message: msg });
});

app.get("/messages/admin/all", (req, res) => {
    const all        = readMessages();
    const complaints = readComplaints();
    const threads    = Object.keys(all).map(complaintId => {
        const thread = all[complaintId];
        const comp   = complaints.find(c => c.id === complaintId);
        const unreadCount = thread.filter(m => m.sender === "user" && !m.read).length;
        const lastMsg = thread[thread.length - 1];
        return {
            complaintId,
            person: comp ? comp.person : "Unknown",
            complaintText: comp ? comp.complaint.substring(0, 60) : "",
            unreadCount,
            lastMessage: lastMsg ? lastMsg.text.substring(0, 50) : "",
            lastTimestamp: lastMsg ? lastMsg.timestamp : null,
            messageCount: thread.length
        };
    });
    threads.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
    res.json({ threads });
});

app.get("/messages/admin/thread/:complaintId", (req, res) => {
    const all    = readMessages();
    const thread = all[req.params.complaintId] || [];
    let updated  = false;
    thread.forEach(msg => { if (msg.sender === "user" && !msg.read) { msg.read = true; updated = true; } });
    if (updated) { all[req.params.complaintId] = thread; saveMessages(all); }
    res.json({ messages: thread });
});

app.post("/messages/admin/send", (req, res) => {
    const { complaintId, text } = req.body;
    if (!complaintId || !text || !text.trim()) return res.json({ success: false });
    const all = readMessages();
    if (!all[complaintId]) all[complaintId] = [];
    const msg = {
        id: uuidv4(), sender: "admin", senderLabel: "SafeSpace Admin",
        text: text.trim(), timestamp: new Date().toISOString(), read: false
    };
    all[complaintId].push(msg);
    saveMessages(all);
    res.json({ success: true, message: msg });
});

app.get("/messages/admin/unread-count", (req, res) => {
    const all = readMessages();
    let count = 0;
    Object.values(all).forEach(thread => {
        thread.forEach(msg => { if (msg.sender === "user" && !msg.read) count++; });
    });
    res.json({ count });
});

app.get("/messages/user/unread-count/:complaintId", (req, res) => {
    const all    = readMessages();
    const thread = all[req.params.complaintId] || [];
    const count  = thread.filter(m => m.sender === "admin" && !m.read).length;
    res.json({ count });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
