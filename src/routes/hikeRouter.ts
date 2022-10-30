import express from  'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import storage from '../middleware/upload.js';
import {createHike, createPhoto, getHikes} from '../services/hikeService.js';
import { Hike } from '../db/models/index.js';

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
).array('files', MAX_FILES_ON_UPLOAD);

hikeRouter.use(async (request, response, next) => {
    try {
        if (request.headers['DIHTAuth'] === undefined || request.headers['DIHTAuth'] !== process.env.DIHT_Auth_Header) {
            return response.status(403).send('The request is not authorized');
        }

        if (request.path === '/' && request.method === 'POST') {
            request.fileUploadId = uuidv4();
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

hikeRouter.post('/', upload, (request, response) => {
    upload(request, response, async (error) => {
        if (error) {
            // TODO: Log this somewhere
            console.log(error);

            response.status(500).send('Error uploading files');
        } else {
            try {
                const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);
                const dataPath = path.join(process.cwd(), 'data', 'images');
                const hikers = request.body.hikers ? request.body.hikers.split(',') : undefined;

                const hikeId = await createHike(Hike.build({
                    trail: request.body.trail,
                    dateOfHike: request.body.dateOfHike,
                    description: request.body.description,
                    link: request.body.link,
                    weather: request.body.weather,
                    crowds: request.body.crowds,
                    tags: request.body.tags
                }), hikers);

                try {
                    fs.statSync(path.join(dataPath, hikeId));
                } catch (err) {
                    fs.mkdirSync(path.join(dataPath, hikeId));
                }

                if (request.files) {
                    const files = request.files as { [fieldname: string]: Express.Multer.File[] };

                    // Since we defined a single body field for the uploads, we look in the first element of the field list to get the array of files
                    for (const file of files[0]) {
                        const photoPath = path.join(dataPath, hikeId, file.originalname);
                        fs.renameSync(path.join(uploadPath, file.originalname), photoPath);
                        await createPhoto(photoPath, hikeId);
                    }
                }

                // Remove the upload staging directory
                fs.rmSync(uploadPath, { recursive: true });

                response.status(201).send();
            } catch (error: any) {
                // TODO: Log this somewhere
                console.log(error);

                response.status(500).send('Error creating hike');
            }
        }
    });
});

export default hikeRouter;
