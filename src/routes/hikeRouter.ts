import express from  'express';
import multer from 'multer';
import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';

import storage from '../middleware/upload.js';
import {getHikes} from '../services/hikeService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const hikeRouter = express.Router();

const MAX_FILES_ON_UPLOAD = 5;

const upload = multer(
    {
        dest: 'data',
        limits: {
            fieldNameSize: 100,
            fileSize: 60000000
        },
        storage: storage
    }
).array('file', MAX_FILES_ON_UPLOAD);

hikeRouter.use(async (request, response, next) => {
    try {
        if (request.headers['DIHTAuth'] === undefined || request.headers['DIHTAuth'] !== process.env.DIHT_Auth_Header) {
            return response.status(403).send('The request is not authorized');
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        return response.status(500).send('An unexpected error occurred')
    }

    next();
});

hikeRouter.get('/', async (request, response) => {
    const page = request.query.page ? Number(request.query.page) : 1;
    const pageSize = request.query.pageSize ? Number(request.query.page) : 10;
    const trail = request.query.trail ? request.query.trail.toString() : undefined;
    const startDate = request.query.startDate ? new Date(request.query.startDate.toString()) : undefined;
    const endDate = request.query.endDate ? new Date(request.query.endDate.toString()) : undefined;

    const hikes = await getHikes(page, pageSize, trail, startDate, endDate);

    response.contentType('application/json');
    response.send(hikes);
});

// hikeRouter.get('/:id', async (request, response) => {
//     const { moment, photo } = getDatabase(getDBConfig());
//     let images = [];
//
//     const momentRecord = await moment.findOne({
//         attributes: ['id', 'comment', 'tags', 'userId', 'createdAt', 'updatedAt'],
//         where: {
//             id: request.params.id
//         }
//     });
//
//     if (momentRecord.userId !== request.currentUserId) {
//         response.status(403).send();
//         return;
//     }
//
//     const imageRecords = await photo.findAll({
//         attributes: ['filePath'],
//         where: {
//             momentId: momentRecord.id
//         }
//     });
//
//     imageRecords.forEach(rec => {
//         images.push({
//             path: `images/${rec.filePath}`
//         });
//     });
//
//     response.contentType('application/json');
//     response.send({
//         id: request.params.id,
//         comment: momentRecord.comment,
//         tags: momentRecord.tags,
//         createdAt: momentRecord.createdAt,
//         updatedAt: momentRecord.updatedAt,
//         images
//     });
// });

// hikeRouter.post('/', (request, response) => {
//     upload(request, response, async (error) => {
//         if (error) {
//             // TODO: Log this somewhere
//             console.log(error);
//
//             response.status(500).send('Error uploading file');
//         } else {
//             const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.currentUserId);
//             const dataPath = path.join(process.cwd(), 'data', 'images');
//             const { moment, photo } = getDatabase(getDBConfig());
//             const momentRecord = await moment.create({
//                 comment: request.body.comment,
//                 tags: request.body.tags,
//                 userId: request.currentUserId
//             });
//
//             try {
//                 fs.statSync(path.join(dataPath, momentRecord.id));
//             } catch (err) {
//                 fs.mkdirSync(path.join(dataPath, momentRecord.id));
//             }
//
//             const photoPath = path.join(dataPath, momentRecord.id, request.file.originalname);
//             fs.renameSync(path.join(uploadPath, request.file.originalname), photoPath);
//
//             await photo.create({
//                 filePath: `${momentRecord.id}/${request.file.originalname}`,
//                 momentId: momentRecord.id,
//                 userId: request.currentUserId
//             });
//
//             fs.rmSync(uploadPath, { recursive: true })
//             response.status(201).send();
//         }
//     });
// });

export default hikeRouter;
