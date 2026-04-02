const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 5);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const roomImagesDir = path.resolve(process.cwd(), UPLOAD_DIR, 'rooms');
const avatarDir = path.resolve(process.cwd(), UPLOAD_DIR, 'avatars');
ensureDir(roomImagesDir);
ensureDir(avatarDir);

function imageFileFilter(req, file, cb) {
  // Accept common image mime types
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  return cb(new Error('Only image uploads are allowed'), false);
}

const roomImagesStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, roomImagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = crypto.randomUUID();
    cb(null, `${unique}${ext}`);
  },
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = crypto.randomUUID();
    cb(null, `avatar_${unique}${ext}`);
  },
});

const uploadRoomImages = multer({
  storage: roomImagesStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

module.exports = {
  uploadRoomImages,
  uploadAvatar,
};

