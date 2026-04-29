/**
 * 파일 업로드 라우트 - 예방접종 기록, 진단서 PDF 업로드
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${req.body.userId || 'unknown'}_${req.body.type || 'doc'}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('PDF, JPG, PNG 파일만 업로드 가능합니다.'));
  }
});

// 파일 업로드
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    const record = {
      id: 'file_' + Date.now(),
      userId: req.body.userId,
      dogId: req.body.dogId || 'default',
      type: req.body.type || 'other', // vaccination, diagnosis
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    // 메타데이터 저장
    const metaFile = path.join(UPLOAD_DIR, 'metadata.json');
    let meta = [];
    try { if (fs.existsSync(metaFile)) meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch(e) {}
    meta.push(record);
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');

    res.json({ success: true, file: record });
  } catch (e) {
    res.status(500).json({ error: '업로드 실패: ' + e.message });
  }
});

// 사용자 파일 목록 조회
router.get('/list/:userId', (req, res) => {
  try {
    const metaFile = path.join(UPLOAD_DIR, 'metadata.json');
    let meta = [];
    try { if (fs.existsSync(metaFile)) meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch(e) {}
    const files = meta.filter(f => f.userId === req.params.userId);
    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ error: '조회 실패' });
  }
});

// 파일 다운로드
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) res.download(filePath);
  else res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
});

// 파일 삭제
router.delete('/:fileId', (req, res) => {
  try {
    const metaFile = path.join(UPLOAD_DIR, 'metadata.json');
    let meta = [];
    try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch(e) {}
    const file = meta.find(f => f.id === req.params.fileId);
    if (!file) return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });

    // 파일 삭제
    const filePath = path.join(UPLOAD_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // 메타데이터에서 제거
    meta = meta.filter(f => f.id !== req.params.fileId);
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '삭제 실패' });
  }
});

module.exports = router;
