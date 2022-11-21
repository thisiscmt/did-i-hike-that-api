import express, {Request, Response} from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import authChecker from '../middleware/authChecker.js';
import uploadStorage from '../middleware/upload.js';
import * as HikeService from '../services/hikeService.js';
import { Hike } from '../db/models/hike.js';
import { db } from '../db/models/index.js';
import {PhotoMaintanance} from '../types/types';

const hikeRouter = express.Router();

const upload = multer({
    limits: {
        fileSize: 10485760  // 10 MB
    },
    storage: uploadStorage
}).array('files', 5);

const dataPath = path.join(process.cwd(), 'data', 'images');

hikeRouter.use(authChecker);

hikeRouter.get('/', async (request: Request, response: Response) => {
    try {
        const page = request.query.page ? Number(request.query.page) : 1;
        const pageSize = request.query.pageSize ? Number(request.query.page) : 10;
        const trail = request.query.trail ? request.query.trail.toString() : undefined;
        const startDate = request.query.startDate ? new Date(request.query.startDate.toString()) : undefined;
        const endDate = request.query.endDate ? new Date(request.query.endDate.toString()) : undefined;

        const hikes = await HikeService.getHikes(page, pageSize, trail, startDate, endDate);

        response.contentType('application/json');
        response.status(200).send(hikes);
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

hikeRouter.post('/', (request: Request, response: Response) => {
    upload(request, response, async (error: any) => {
        if (error) {
            // TODO: Log this somewhere
            console.log(error);

            response.status(500).send('Error uploading files');
        } else {
            const transaction = await db.transaction();

            try {
                const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);
                const hike = Hike.build({
                    trail: request.body.trail,
                    dateOfHike: request.body.dateOfHike,
                    description: request.body.description,
                    link: request.body.link,
                    weather: request.body.weather,
                    crowds: request.body.crowds,
                    tags: request.body.tags
                });
                const hikers = request.body.hikers ? request.body.hikers.split(',') : undefined;
                const hikeId = await HikeService.createHike(hike, hikers);
                let photoPath: string;

                if (request.files && request.files.length > 0) {
                    try {
                        fs.statSync(path.join(dataPath, hikeId));
                    } catch (err) {
                        fs.mkdirSync(path.join(dataPath, hikeId));
                    }

                    const files = request.files as Express.Multer.File[];

                    for (const file of files) {
                        photoPath = path.join(dataPath, hikeId, file.originalname);
                        fs.renameSync(path.join(uploadPath, file.originalname), photoPath);
                        await HikeService.createPhoto(file.originalname, photoPath, hikeId);
                    }

                    fs.rmdir(uploadPath, { recursive: true }, (error) => {
                        if (error) {
                            // TODO: Log this somewhere
                            console.log(error);
                        }
                    });
                }

                await transaction.commit();
                response.status(201).send();
            } catch (error: any) {
                // TODO: Log this somewhere
                console.log(error);

                await transaction.rollback();
                response.status(500).send('Error creating hike');
            }
        }
    });
});

hikeRouter.put('/', async (request: Request, response: Response) => {
    upload(request, response, async (error: any) => {
        if (error) {
            // TODO: Log this somewhere
            console.log(error);

            response.status(500).send('Error uploading files');
        } else {
            const transaction = await db.transaction();

            try {
                const hike = Hike.build({
                    id: request.body.id,
                    trail: request.body.trail,
                    dateOfHike: request.body.dateOfHike,
                    description: request.body.description,
                    link: request.body.link,
                    weather: request.body.weather,
                    crowds: request.body.crowds,
                    tags: request.body.tags
                });
                const hikers = request.body.hikers ? request.body.hikers.split(',') : undefined;

                await HikeService.updateHike(hike, hikers);

                if (request.body.photos) {
                    const photos = JSON.parse(request.body.photos);
                    const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);
                    let photoPath: string;

                    for (const photo of photos as PhotoMaintanance[]) {
                        photoPath = path.join(dataPath, hike.id, photo.fileName);

                        switch (photo.action) {
                            case 'add':
                                fs.renameSync(path.join(uploadPath, photo.fileName), photoPath);
                                await HikeService.createPhoto(photo.fileName, photoPath, hike.id);

                                break;
                            case 'update':
                                fs.unlinkSync(photoPath);
                                fs.renameSync(path.join(uploadPath, photo.fileName), photoPath);

                                break;
                            case 'delete':
                                try {
                                    await HikeService.deletePhoto(photo.id);
                                    fs.unlinkSync(photoPath);
                                } catch (error: any) {
                                    // TODO: Log this somewhere
                                    console.log(error);
                                }

                                break;
                        }
                    }

                    fs.rmdir(uploadPath, { recursive: true }, (error) => {
                        if (error) {
                            // TODO: Log this somewhere
                            console.log(error);
                        }
                    });
                }

                await transaction.commit();
                response.status(204).send();
            } catch (error: any) {
                // TODO: Log this somewhere
                console.log(error);

                await transaction.rollback();
                response.status(500).send('Error updating hike');
            }
        }
    });
});

hikeRouter.delete('/', async (request: Request, response: Response) => {
    try {
        const hikeId = request.query.hikeId ? request.query.hikeId.toString() : null;


        if (!hikeId) {
            response.status(400).send('Missing hike ID');
            return;
        }

        const photoPath = path.join(dataPath, hikeId);
        await HikeService.deleteHike(hikeId);
        fs.rmdir(photoPath, { recursive: true }, (error) => {
            if (error) {
                // TODO: Log this somewhere
                console.log(error);
            }
        });

        response.status(204).send();
    } catch (error: any) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error deleting hike');
    }
});

export default hikeRouter;
