import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!req.fileUploadId) {
            cb(new Error('Missing '), '');
            return;
        }

        const uploadPath = path.join(process.cwd(), 'data', 'uploads', req.fileUploadId);
        let stat;

        // See if the directory exists and if not, create it
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
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

export default storage;
