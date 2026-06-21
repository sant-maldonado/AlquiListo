import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { StorageService } from '../services/storageService.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_PHOTOS_PER_UPLOAD = 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, StorageService.getUploadsDir());
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido. Las fotos deben ser JPG, PNG o WEBP'));
  }
  cb(null, true);
}

export const uploadPhotosMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).array('photos', MAX_PHOTOS_PER_UPLOAD);
