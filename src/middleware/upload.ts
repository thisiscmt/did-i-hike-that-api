import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dataPath = path.join(process.cwd(), 'data', 'uploads', req.currentUserId);
        let stat;

        // See if the directory exists and if not, create it
        try {
            stat = fs.statSync(dataPath);
        } catch (err) {
            fs.mkdirSync(dataPath);
        }

        if (stat && !stat.isDirectory()) {
            throw new Error("Directory cannot be created because an inode of a different type exists at '" + dataPath + "'");
        }

        cb(null, dataPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

export default storage;
