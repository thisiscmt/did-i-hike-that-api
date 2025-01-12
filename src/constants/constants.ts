import path from 'path';

export const APP_DATA_PATH = path.join(process.cwd(), 'app_data');
export const IMAGES_PATH = path.join(process.cwd(), 'app_data', 'images');
export const UPLOADS_PATH = path.join(process.cwd(), 'app_data', 'uploads');
export const MAX_FILE_UPLOAD = 10;
export const MAX_DATABASE_BACKUPS = 10;
export const SESSION_COOKIE_NAME = 'sid';
export const DEMO_USER_NAME = 'demo@example.com';
