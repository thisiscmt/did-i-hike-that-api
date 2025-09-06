import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

import { UPLOADS_PATH } from '../constants/constants.js';

const uploadStorage = multer.diskStorage({
    destination: function (request: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        if (!request.fileUploadId) {
            cb(new Error('Missing file upload ID'), '');
            return;
        }

        const uploadPath = path.join(UPLOADS_PATH, request.fileUploadId);
        let stat;

        try {
            stat = fs.statSync(uploadPath);
        } catch (_error) {
            fs.mkdirSync(uploadPath);
        }

        if (stat && !stat.isDirectory()) {
            throw new Error(`Directory cannot be created because an inode of a different type exists at '${uploadPath}'`);
        }

        cb(null, uploadPath);
    },
    filename: function (_request: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        cb(null, file.originalname);
    }
});

export default uploadStorage;
