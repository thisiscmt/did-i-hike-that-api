import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {Request} from 'express';

const uploadStorage = multer.diskStorage({
    destination: function (request: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        if (!request.fileUploadId) {
            cb(new Error('Missing file upload ID'), '');
            return;
        }

        const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);
        let stat;

        try {
            stat = fs.statSync(uploadPath);
        } catch (err) {
            fs.mkdirSync(uploadPath);
        }

        if (stat && !stat.isDirectory()) {
            throw new Error(`Directory cannot be created because an inode of a different type exists at '${uploadPath}'`);
        }

        cb(null, uploadPath);
    },
    filename: function (request: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        cb(null, file.originalname);
    }
});

export default uploadStorage;
