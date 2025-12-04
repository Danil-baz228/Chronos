import multer from "multer";
import path from "path";
import fs from "fs";

// Папка з аватарками
const uploadPath = "uploads/avatars";

// Створюємо папку якщо її нема
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Налаштування зберігання
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + "_" + Date.now() + ext);
  },
});

// Фільтр — приймаємо тільки зображення
function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only images allowed"), false);
  }
  cb(null, true);
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("avatar");

export default uploadAvatar;
