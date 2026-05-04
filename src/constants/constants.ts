import path from 'path';

export const APP_DATA_PATH = path.join(process.cwd(), 'app_data');
export const IMAGES_PATH = path.join(process.cwd(), 'app_data', 'images');
export const UPLOADS_PATH = path.join(process.cwd(), 'app_data', 'uploads');
export const MAX_FILEs_PER_UPLOAD = 10;
export const MAX_DATABASE_BACKUPS = 12;
export const SESSION_COOKIE_NAME = 'sid';
export const DEMO_USER_NAME = 'demo@example.com';
export const LOG_FILE_NAME = 'api.log';
export const PHOTO_RESIZE_PERCENTAGE = 0.30;
export const PHOTO_THUMBNAIL_SIZE = 250;
