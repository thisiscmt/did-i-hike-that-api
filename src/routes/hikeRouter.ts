import express from  'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import * as HikeService from '../services/hikeService.js';
import { Hike } from '../db/models/hike.js';
import authChecker from '../middleware/authChecker.js';
import uploadStorage from '../middleware/upload.js';

const hikeRouter = express.Router();

const upload = multer({
    limits: {
        fileSize: 10485760  // 10 MB
    },
    storage: uploadStorage
}).array('files', 5);

hikeRouter.use(authChecker);

hikeRouter.get('/', async (request, response) => {
    try {
        const page = request.query.page ? Number(request.query.page) : 1;
        const pageSize = request.query.pageSize ? Number(request.query.page) : 10;
        const trail = request.query.trail ? request.query.trail.toString() : undefined;
        const startDate = request.query.startDate ? new Date(request.query.startDate.toString()) : undefined;
        const endDate = request.query.endDate ? new Date(request.query.endDate.toString()) : undefined;

        const hikes = await HikeService.getHikes(page, pageSize, trail, startDate, endDate);

        response.contentType('application/json');
        response.send(hikes);
    } catch (error: any) {
        response.status(500).send('Error retrieving hikes');
    }
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

hikeRouter.post('/', (request, response) => {
    upload(request, response, async (error: any) => {
        if (error) {
            // TODO: Log this somewhere
            console.log(error);

            response.status(500).send('Error uploading files');
        } else {
            try {
                const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);
                const dataPath = path.join(process.cwd(), 'data', 'images');
                const hikers = request.body.hikers ? request.body.hikers.split(',') : undefined;

                const hikeId = await HikeService.createHike(Hike.build({
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
                    const files = request.files as Express.Multer.File[];

                    for (const file of files) {
                        const photoPath = path.join(dataPath, hikeId, file.originalname);
                        fs.renameSync(path.join(uploadPath, file.originalname), photoPath);
                        await HikeService.createPhoto(photoPath, hikeId);
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

hikeRouter.put('/', (request, response) => {
    // TODO
});

hikeRouter.delete('/', (request, response) => {
    try {
        const hikeId = request.query.hikeId ? request.query.hikeId.toString() : null;

        if (hikeId) {
            HikeService.deleteHike(hikeId);
        } else {
            response.status(400).send('Missing hike ID');
        }
    } catch (error: any) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error deleting hike');
    }
});

export default hikeRouter;
