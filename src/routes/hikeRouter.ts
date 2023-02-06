import express, {Request, Response} from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import authChecker from '../middleware/authChecker.js';
import uploadStorage from '../middleware/upload.js';
import * as HikeService from '../services/hikeService.js';
import * as SharedService from '../services/sharedService.js';
import {PhotoMetadata} from '../models/models.js';
import { Hike } from '../db/models/hike.js';
import { db } from '../db/models/index.js';

const hikeRouter = express.Router();

const DATA_PATH = path.join(process.cwd(), 'data', 'images');
const MAX_FILE_UPLOAD = 10;

const upload = multer({
    limits: {
        fileSize: 10485760  // 10 MB
    },
    storage: uploadStorage
}).array('files', MAX_FILE_UPLOAD);

hikeRouter.use(authChecker);

hikeRouter.get('/', async (request: Request, response: Response) => {
    try {
        const page = request.query.page ? Number(request.query.page) : 1;
        const pageSize = request.query.pageSize ? Number(request.query.pageSize) : 10;
        const startDate = request.query.startDate ? SharedService.getDateValue(request.query.startDate.toString()) : undefined;
        const endDate = request.query.endDate ? SharedService.getDateValue(request.query.endDate.toString()) : undefined;
        const searchText = request.query.searchText ? request.query.searchText.toString() : undefined;

        const searchParams = {
            page: (page - 1) * pageSize,
            pageSize,
            startDate,
            endDate,
            searchText
        }

        const hikes = await HikeService.getHikes(searchParams);

        response.contentType('application/json');
        response.status(200).send(hikes);
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error retrieving hikes');
    }
});

hikeRouter.get('/:id', async (request, response) => {
    const hike = await HikeService.getHike(request.params.id);

    if (hike) {
        response.contentType('application/json');
        response.status(200).send(hike);
    } else {
        response.status(404).send();
    }
});

hikeRouter.post('/', (request: Request, response: Response) => {
    // TODO: Check for required input

    upload(request, response, async (error) => {
        if (error) {
            // TODO: Log this somewhere
            console.log(error);

            response.status(400).send(`Error uploading files: ${error.code}`);
        } else {
            const transaction = await db.transaction();

            try {
                const hike = Hike.build({
                    trail: request.body.trail,
                    dateOfHike: request.body.dateOfHike,
                    description: request.body.description,
                    link: request.body.link,
                    conditions: request.body.conditions,
                    crowds: request.body.crowds,
                    tags: request.body.tags ? request.body.tags.toLowerCase() : ''
                });
                const hikers = request.body.hikers ? request.body.hikers.split(',') : undefined;
                const hikeId = await HikeService.createHike(hike, hikers);

                if (request.files && request.files.length > 0) {
                    try {
                        fs.mkdirSync(path.join(DATA_PATH, hikeId));
                    } catch (err) {
                        // TODO: Log this somewhere
                    }

                    const files = request.files as Express.Multer.File[];
                    const photoMetadata = request.body.photos ? JSON.parse(request.body.photos) : new Array<PhotoMetadata>();
                    const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);

                    for (const file of files) {
                        await SharedService.resizeImage(path.join(uploadPath, file.originalname), path.join(DATA_PATH, hikeId, file.originalname));
                        await HikeService.createPhoto(file.originalname, hikeId, SharedService.getCaption(file.originalname, photoMetadata));
                    }

                    fs.rm(uploadPath, { recursive: true }, (error) => {
                        if (error) {
                            // TODO: Log this somewhere
                            console.log(error);
                        }
                    });
                }

                await transaction.commit();
                response.status(201).send(hikeId);
            } catch (error) {
                // TODO: Log this somewhere
                console.log(error);

                await transaction.rollback();
                response.status(500).send('Error creating hike');
            }
        }
    });
});

hikeRouter.put('/:id', async (request: Request, response: Response) => {
    upload(request, response, async (error) => {
        if (error) {
            // TODO: Log this somewhere
            console.log(error);

            response.status(500).send('Error uploading files');
        } else {
            const transaction = await db.transaction();

            try {
                const hike = Hike.build({
                    id: request.params.id,
                    trail: request.body.trail,
                    dateOfHike: request.body.dateOfHike,
                    description: request.body.description,
                    link: request.body.link,
                    conditions: request.body.conditions,
                    crowds: request.body.crowds,
                    tags: request.body.tags
                });
                const hikers = request.body.hikers ? request.body.hikers.split(',') : undefined;

                await HikeService.updateHike(hike, hikers);
                const photoMetadata = request.body.photos ? JSON.parse(request.body.photos) : new Array<PhotoMetadata>();

                if (photoMetadata.length > 0) {
                    const photoMetadata = JSON.parse(request.body.photos);
                    const uploadPath = path.join(process.cwd(), 'data', 'uploads', request.fileUploadId);
                    let uploadFilePath: string;
                    let photoPath: string;
                    let caption: string | undefined;

                    for (const photo of photoMetadata as PhotoMetadata[]) {
                        uploadFilePath = path.join(uploadPath, photo.fileName);
                        photoPath = path.join(DATA_PATH, hike.id, photo.fileName);
                        caption = photo.caption ? photo.caption : undefined

                        switch (photo.action) {
                            case 'add':
                                await SharedService.resizeImage(uploadFilePath, photoPath);
                                await HikeService.createPhoto(photo.fileName, hike.id, caption);

                                break;
                            case 'update':
                                fs.unlinkSync(photoPath);
                                await SharedService.resizeImage(uploadFilePath, photoPath);
                                await HikeService.updatePhoto(photo.id, caption);

                                break;
                            case 'delete':
                                await HikeService.deletePhoto(photo.id);

                                fs.unlink(photoPath, (error) => {
                                    if (error) {
                                        // TODO: Log this somewhere
                                    }
                                });

                                break;
                        }
                    }

                    fs.rm(uploadPath, { recursive: true }, (error) => {
                        if (error) {
                            // TODO: Log this somewhere
                            console.log(error);
                        }
                    });
                }

                await transaction.commit();
                response.status(204).send();
            } catch (error) {
                // TODO: Log this somewhere
                console.log(error);

                await transaction.rollback();
                response.status(500).send('Error updating hike');
            }
        }
    });
});

hikeRouter.delete('/:id', async (request: Request, response: Response) => {
    try {
        if (await HikeService.hikeExists(request.params.id)) {
            const photoPath = path.join(DATA_PATH, request.params.id);
            await HikeService.deleteHike(request.params.id);

            fs.rm(photoPath, { recursive: true }, (error) => {
                if (error) {
                    // TODO: Log this somewhere
                }
            });

            response.status(204).send();
        } else {
            // TODO: Log this somewhere
            response.status(404).send();
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error deleting hike');
    }
});

export default hikeRouter;
