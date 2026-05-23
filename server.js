const express = require("express");
const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const cfg = require("./config");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use("/api/", limiter);

// --- Database (sql.js — pure JavaScript, no compilation needed) ---
const dbPath = path.join(__dirname, "data", "quiz.db");
let db;

function saveDb() {
  const data = db.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_name TEXT, student_name TEXT NOT NULL,
    score REAL, correct INTEGER, total INTEGER,
    answers TEXT, question_ids TEXT,
    started_at TEXT, submitted_at TEXT, duration_seconds INTEGER
  )`);
  saveDb();
  console.log("Database ready: " + dbPath);
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

const allQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, "questions.json"), "utf8"));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

app.get("/api/questions", (req, res) => {
  let pool = cfg.SHUFFLE_QUESTIONS ? shuffle(allQuestions) : [...allQuestions];
  const selected = pool.slice(0, Math.min(cfg.NUM_QUESTIONS, pool.length));
  const questions = selected.map((q) => {
    let opts = [...q.opts], correctAns = q.ans;
    if (cfg.SHUFFLE_OPTIONS) {
      const indexed = opts.map((o, i) => ({ o, correct: i === correctAns }));
      const shuffled = shuffle(indexed);
      opts = shuffled.map((x) => x.o);
      correctAns = shuffled.findIndex((x) => x.correct);
    }
    return { id: q.id, q: q.q, opts }; // ans NOT sent
  });
  res.json({
    questions, ids: questions.map((q) => q.id),
    config: { title: cfg.EXAM_TITLE, subtitle: cfg.EXAM_SUBTITLE,
      duration: cfg.EXAM_DURATION_MINUTES, passing: cfg.PASSING_SCORE, session: cfg.SESSION_NAME }
  });
});

app.post("/api/submit", (req, res) => {
  const { studentName, answers, ids, startedAt } = req.body;
  if (!studentName || !Array.isArray(answers) || !Array.isArray(ids))
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  const questionMap = {};
  allQuestions.forEach((q) => (questionMap[q.id] = q));
  let correct = 0;
  const detail = ids.map((id, i) => {
    const q = questionMap[id];
    if (!q) return { correct: false };
    const isCorrect = answers[i] === q.ans;
    if (isCorrect) correct++;
    return { id, correct: isCorrect, correctAns: q.ans, chosen: answers[i] };
  });
  const total = ids.length;
  const score = Math.round((correct / total) * 10 * 10) / 10;
  const submittedAt = new Date().toISOString();
  const durationSeconds = Math.round((new Date() - new Date(startedAt)) / 1000);
  dbRun(
    `INSERT INTO sessions (session_name,student_name,score,correct,total,answers,question_ids,started_at,submitted_at,duration_seconds) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [cfg.SESSION_NAME, studentName.trim(), score, correct, total, JSON.stringify(answers), JSON.stringify(ids), startedAt, submittedAt, durationSeconds]
  );
  res.json({ score, correct, total, passing: cfg.PASSING_SCORE, detail });
});

app.get("/api/admin/results", (req, res) => {
  const { password, session } = req.query;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });
  let sql = "SELECT id,session_name,student_name,score,correct,total,submitted_at,duration_seconds FROM sessions";
  const params = [];
  if (session) { sql += " WHERE session_name=?"; params.push(session); }
  sql += " ORDER BY submitted_at DESC";
  res.json({ results: dbAll(sql, params) });
});

app.get("/api/admin/export-csv", (req, res) => {
  const { password, session } = req.query;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });
  let sql = "SELECT * FROM sessions";
  const params = [];
  if (session) { sql += " WHERE session_name=?"; params.push(session); }
  const rows = dbAll(sql + " ORDER BY submitted_at DESC", params);
  const lines = ["STT,Họ tên,Điểm,Đúng,Tổng,Giờ nộp,Thời gian làm,Xếp loại,Kỳ thi"];
  rows.forEach((r, i) => {
    const m = Math.floor(r.duration_seconds/60), s = r.duration_seconds%60;
    const loai = r.score >= cfg.PASSING_SCORE ? "Đạt" : "Chưa đạt";
    const t = new Date(r.submitted_at).toLocaleString("vi-VN");
    lines.push(`${i+1},"${r.student_name}",${r.score},${r.correct},${r.total},"${t}","${m}p${s}s","${loai}","${r.session_name}"`);
  });
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition","attachment; filename=ket_qua_thi.csv");
  res.send("\uFEFF" + lines.join("\n"));
});

initDb().then(() => {
  app.listen(cfg.PORT, () => {
    console.log("\n🚀 Quiz App: http://localhost:" + cfg.PORT);
    console.log("🔒 Admin:    http://localhost:" + cfg.PORT + "/admin.html\n");
  });
});

// --- Practical exam module ---
const practicalRouter = require("./practical");
app.use("/api", practicalRouter);
