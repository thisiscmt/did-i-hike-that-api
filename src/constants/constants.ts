import path from 'path';

export const USER_SESSION_COOKIE = 'DIHT_User_Session';

export const IMAGES_PATH = path.join(process.cwd(), 'app_data', 'images');
export const UPLOADS_PATH = path.join(process.cwd(), 'app_data', 'uploads');
export const MAX_FILE_UPLOAD = 10;
