// practical.js — Module thi thực hành
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cfg = require("./config");

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "uploads");
const EXAMS_DIR = path.join(__dirname, "exams");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(EXAMS_DIR, { recursive: true });

// --- Multer config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // Tên file = tên gốc học viên đặt, thêm timestamp để tránh trùng
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9À-ỹ\s\-_]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    const ts = Date.now();
    cb(null, `${base}_${ts}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: cfg.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".zip", ".rar", ".7z", ".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Định dạng file không được phép. Chỉ chấp nhận: zip, rar, pdf, docx, png, jpg"));
  }
});

// --- Tải đề thi ---
router.get("/download-exam", (req, res) => {
  const files = fs.readdirSync(EXAMS_DIR).filter(f =>
    [".docx", ".doc", ".pdf"].includes(path.extname(f).toLowerCase())
  );
  if (files.length === 0) return res.status(404).json({ error: "Chưa có đề thi" });
  // Trả về file đầu tiên (hoặc file được config)
  const examFile = cfg.EXAM_FILENAME || files[0];
  const filePath = path.join(EXAMS_DIR, examFile);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File đề thi không tồn tại" });
  res.download(filePath, examFile);
});

// --- Nộp bài ---
router.post("/submit-practical", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Không có file được upload" });
  const { studentName } = req.body;
  if (!studentName || studentName.trim().length < 2)
    return res.status(400).json({ error: "Vui lòng nhập họ tên" });

  // Ghi log vào file JSON đơn giản
  const logPath = path.join(UPLOADS_DIR, "submissions.json");
  let logs = [];
  if (fs.existsSync(logPath)) {
    try { logs = JSON.parse(fs.readFileSync(logPath, "utf8")); } catch(e) {}
  }
  const entry = {
    id: Date.now(),
    studentName: studentName.trim(),
    originalName: req.file.originalname,
    savedName: req.file.filename,
    size: req.file.size,
    session: cfg.SESSION_NAME,
    submittedAt: new Date().toISOString()
  };
  logs.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  res.json({ ok: true, message: "Nộp bài thành công!", filename: req.file.filename });
});

// --- Admin: danh sách bài nộp ---
router.get("/admin/practical-list", (req, res) => {
  const { password } = req.query;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });

  const logPath = path.join(UPLOADS_DIR, "submissions.json");
  let logs = [];
  if (fs.existsSync(logPath)) {
    try { logs = JSON.parse(fs.readFileSync(logPath, "utf8")); } catch(e) {}
  }
  res.json({ submissions: logs.reverse(), total: logs.length });
});

// --- Admin: tải file bài nộp ---
router.get("/admin/download/:filename", (req, res) => {
  const { password } = req.query;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });

  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File không tồn tại" });
  res.download(filePath);
});

// --- Admin: tải tất cả bài nộp (zip) ---
router.get("/admin/download-all", async (req, res) => {
  const { password } = req.query;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });

  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f !== "submissions.json");
  if (files.length === 0) return res.status(404).json({ error: "Chưa có bài nộp" });

  // Stream zip using archiver
  const archiver = require("archiver");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=tat_ca_bai_nop_${Date.now()}.zip`);
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.pipe(res);
  files.forEach(f => archive.file(path.join(UPLOADS_DIR, f), { name: f }));
  archive.finalize();
});

// --- Admin: xoá bài nộp ---
router.delete("/admin/practical-clear", (req, res) => {
  const { password } = req.body;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });
  const files = fs.readdirSync(UPLOADS_DIR);
  files.forEach(f => fs.unlinkSync(path.join(UPLOADS_DIR, f)));
  res.json({ ok: true });
});

module.exports = router;

// --- Admin: upload đề thi mới ---
const examUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, EXAMS_DIR),
    filename: (req, file, cb) => cb(null, file.originalname)
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".docx", ".doc", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Chỉ chấp nhận .docx, .doc, .pdf"));
  }
});

router.post("/admin/upload-exam", examUpload.single("file"), (req, res) => {
  if (req.body.password !== cfg.ADMIN_PASSWORD)
    return res.status(401).json({ error: "Sai mật khẩu" });
  if (!req.file) return res.status(400).json({ error: "Không có file" });
  res.json({ ok: true, filename: req.file.filename });
});

// --- Admin: list exam files ---
router.get("/admin/exam-files", (req, res) => {
  const { password } = req.query;
  if (password !== cfg.ADMIN_PASSWORD) return res.status(401).json({ error: "Sai mật khẩu" });
  const files = fs.readdirSync(EXAMS_DIR)
    .filter(f => [".docx",".doc",".pdf"].includes(path.extname(f).toLowerCase()))
    .map(f => {
      const stat = fs.statSync(path.join(EXAMS_DIR, f));
      return { name: f, size: stat.size };
    });
  res.json({ files });
});
