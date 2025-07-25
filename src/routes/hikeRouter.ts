import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import authChecker from '../middleware/authChecker.js';
import uploadChecker from '../middleware/uploadChecker.js';
import hikeValidation from '../middleware/hikeValidation.js';
import uploadStorage from '../middleware/upload.js';
import { db } from '../db/models/index.js';
import { PhotoMetadata } from '../models/models.js';
import { Hike } from '../db/models/hike.js';
import { Hiker } from '../db/models/hiker.js';
import * as HikeService from '../services/hikeService.js';
import * as SharedService from '../services/sharedService.js';
import * as Constants from '../constants/constants.js';

const hikeRouter = express.Router();

const upload = multer({
    limits: {
        fileSize: process.env.DIHT_PHOTO_MAX_SIZE ? Number(process.env.DIHT_PHOTO_MAX_SIZE) : 15728640  // Default is 15 MB
    },
    storage: uploadStorage
}).array('files', Constants.MAX_FILE_UPLOAD);

hikeRouter.use(authChecker);

hikeRouter.get('/', async (request: Request, response: Response) => {
    try {
        const page = request.query.page ? Number(request.query.page) : 1;
        const pageSize = request.query.pageSize ? Number(request.query.pageSize) : 10;
        const startDate = request.query.startDate ? SharedService.getDateValue(request.query.startDate.toString()) : undefined;
        const endDate = request.query.endDate ? SharedService.getDateValue(request.query.endDate.toString()) : undefined;
        const searchText = request.query.searchText ? request.query.searchText.toString() : undefined;

        const searchParams = {
            userName: request.session.email || '',
            userId: request.session.userId || '',
            page: (page - 1) * pageSize,
            pageSize,
            startDate,
            endDate,
            searchText
        }

        const hikes = await HikeService.getHikes(searchParams);

        response.status(200).send(hikes);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving hikes');
    }
});

hikeRouter.get('/deleted', async (_request: Request, response: Response) => {
    try {
        const hikes = await HikeService.getDeletedHikes();

        response.status(200).send(hikes);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving deleted hikes');
    }
});

hikeRouter.get('/:id', async (request, response) => {
    const hike = await HikeService.getHike(request.params.id);

    if (hike) {
        if (request.session.email === Constants.DEMO_USER_NAME) {
            if (request.session.userId !== hike.userId) {
                response.status(403).send();
                return;
            }
        }

        hike.hikers?.sort((lValue: Hiker, rValue: Hiker) => lValue.fullName.localeCompare(rValue.fullName));
        response.status(200).send(hike);
    } else {
        response.status(404).send();
    }
});

hikeRouter.post('/', uploadChecker, hikeValidation, (request: Request, response: Response) => {
    upload(request, response, async (error) => {
        if (error) {
            console.log(error);

            const msg = error.message ? error.message : 'An error occurred during a file upload';
            response.status(500).send(msg);
        } else {
            const transaction = await db.transaction();

            try {
                const hike = Hike.build({
                    trail: request.body.trail || '',
                    dateOfHike: request.body.dateOfHike,
                    endDateOfHike: request.body.endDateOfHike ? request.body.endDateOfHike : undefined,
                    description: request.body.description || '',
                    link: request.body.link || '',
                    linkLabel: request.body.linkLabel || '',
                    conditions: request.body.conditions || '',
                    crowds: request.body.crowds || '',
                    tags: request.body.tags ? request.body.tags.toLowerCase() : '',
                    deleted: false,
                    userId: request.session.userId ? request.session.userId : ''
                });

                const hikers = request.body.hikers ? request.body.hikers.split(',') : new Array<string>();
                const photoMetadata = request.body.photos ? JSON.parse(request.body.photos) : new Array<PhotoMetadata>();
                const validationResult = HikeService.validateHikeData(hike, hikers, photoMetadata);

                if (validationResult.invalid) {
                    response.status(400).send(`Invalid hike data: ${validationResult.fieldName}`);
                    return;
                }

                const hikeId = await HikeService.createHike(hike, hikers);

                if (request.files && request.files.length > 0) {
                    try {
                        fs.mkdirSync(path.join(Constants.IMAGES_PATH, hikeId));
                    } catch {
                        // We don't care about the failure, it just means the target directory is already present
                    }

                    const files = request.files as Express.Multer.File[];
                    const uploadPath = path.join(Constants.UPLOADS_PATH, request.fileUploadId);

                    for (const file of files) {
                        await SharedService.resizePhoto(path.join(uploadPath, file.originalname), path.join(Constants.IMAGES_PATH, hikeId, file.originalname));
                        await HikeService.createPhoto(file.originalname, hikeId, photoMetadata.ordinal, SharedService.getCaption(file.originalname, photoMetadata));
                    }

                    fs.rm(uploadPath, { recursive: true }, (error) => {
                        if (error) {
                            console.log(error);
                        }
                    });
                }

                const hikeRecord = await HikeService.getHike(hike.id);
                await transaction.commit();
                response.status(201).send(hikeRecord);
            } catch (error) {
                console.log(error);
                await transaction.rollback();
                response.status(500).send('Error creating hike');
            }
        }
    });
});

hikeRouter.put('/:id', uploadChecker, async (request: Request, response: Response) => {
    upload(request, response, async (error) => {
        if (error) {
            console.log(error);

            const msg = error.message ? error.message : 'An error occurred during a file upload';

            if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
                response.status(400).send(msg);
            } else {
                response.status(500).send(msg);
            }
        } else {
            if (request.session.email === Constants.DEMO_USER_NAME) {
                const existingHike = await HikeService.getHike(request.params.id);

                if (existingHike && request.session.userId !== existingHike.userId) {
                    response.status(403).send();
                    return;
                }
            }

            const transaction = await db.transaction();

            try {
                const hike = Hike.build({
                    id: request.params.id,
                    trail: request.body.trail,
                    dateOfHike: request.body.dateOfHike,
                    endDateOfHike: request.body.endDateOfHike ? request.body.endDateOfHike : undefined,
                    description: request.body.description || '',
                    link: request.body.link || '',
                    linkLabel: request.body.linkLabel || '',
                    conditions: request.body.conditions || '',
                    crowds: request.body.crowds || '',
                    tags: request.body.tags ? request.body.tags.toLowerCase() : '',
                    deleted: false
                });

                const hikers = request.body.hikers ? request.body.hikers.split(',') : new Array<string>();
                const photoMetadata = request.body.photos ? JSON.parse(request.body.photos) : new Array<PhotoMetadata>();
                const validationResult = HikeService.validateHikeData(hike, hikers, photoMetadata);

                if (validationResult.invalid) {
                    response.status(400).send(`Invalid hike data: ${validationResult.fieldName}`);
                    return;
                }

                await HikeService.updateHike(hike, hikers);

                if (photoMetadata.length > 0) {
                    const photoMetadata = JSON.parse(request.body.photos);
                    const uploadPath = path.join(Constants.UPLOADS_PATH, request.fileUploadId);
                    let uploadFilePath: string;
                    let photoPath: string;
                    let photoExt: string;
                    let thumbnailPath: string;
                    let hasFile: boolean;

                    for (const metadata of photoMetadata as PhotoMetadata[]) {
                        uploadFilePath = path.join(uploadPath, metadata.fileName);
                        photoPath = path.join(Constants.IMAGES_PATH, hike.id, metadata.fileName);

                        switch (metadata.action) {
                            case 'add':
                                try {
                                    fs.mkdirSync(path.join(Constants.IMAGES_PATH, hike.id));
                                } catch {
                                    // We don't care about the failure, it just means the target directory is already present
                                }

                                await SharedService.resizePhoto(uploadFilePath, photoPath);
                                await HikeService.createPhoto(metadata.fileName, hike.id, metadata.ordinal, metadata.caption);

                                break;
                            case 'update':
                                hasFile = false;

                                if (request.files && request.files.length > 0) {
                                    const files = request.files as Express.Multer.File[];
                                    hasFile = !!files.find((file: Express.Multer.File) => file.originalname.toLowerCase() === metadata.fileName.toLowerCase())
                                }

                                if (hasFile) {
                                    fs.unlinkSync(photoPath);
                                    await SharedService.resizePhoto(uploadFilePath, photoPath);
                                }

                                await HikeService.updatePhoto(metadata);

                                break;
                            case 'delete':
                                await HikeService.deletePhoto(metadata.id);

                                fs.unlink(photoPath, (error) => {
                                    if (error) {
                                        console.log('Error removing a photo: %o', metadata);
                                    }
                                });

                                photoExt = path.extname(photoPath);
                                thumbnailPath = photoPath.replace(photoExt, '');
                                thumbnailPath = `${thumbnailPath}_thumbnail${photoExt}`;

                                fs.unlink(thumbnailPath, (error) => {
                                    if (error) {
                                        console.log('Error removing a photo thumbnail: %o', thumbnailPath);
                                    }
                                });

                                break;
                        }
                    }

                    fs.stat(uploadPath, (error) => {
                        if (!error) {
                            fs.rm(uploadPath, { recursive: true }, (error) => {
                                if (error) {
                                    console.log(error);
                                }
                            });
                        }
                    });
                }

                const hikeRecord = await HikeService.getHike(hike.id);
                await transaction.commit();
                response.status(200).send(hikeRecord);
            } catch (error) {
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
            if (request.session.email === Constants.DEMO_USER_NAME) {
                const existingHike = await HikeService.getHike(request.params.id);

                if (existingHike && request.session.userId !== existingHike.userId) {
                    response.status(403).send();
                    return;
                }
            }

            const photoPath = path.join(Constants.IMAGES_PATH, request.params.id);
            await HikeService.deleteHike(request.params.id);

            fs.rename(photoPath, `${photoPath}_deleted`, (error) => {
                if (error) {
                    console.log('Error renaming the photo directory for a deleted hike: %o', photoPath);
                }
            });

            response.status(204).send();
        } else {
            console.log(`Attempted deletion of a missing hike: ${request.params.id}`);
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);
        response.status(500).send('Error deleting hike');
    }
});

hikeRouter.put('/deleted/:id', async (request: Request, response: Response) => {
    try {
        if (await HikeService.hikeExists(request.params.id)) {
            await HikeService.undeleteHike(request.params.id);
            response.status(204).send();
        } else {
            console.log(`Attempted un-deletion of a missing hike: ${request.params.id}`);
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);
        response.status(500).send('Error un-deleting hike');
    }
});

hikeRouter.delete('/deleted/:id', async (request: Request, response: Response) => {
    try {
        if (await HikeService.hikeExists(request.params.id)) {
            await HikeService.deleteHike(request.params.id, true);
            response.status(204).send();
        } else {
            console.log(`Attempted permanent deletion of a missing hike: ${request.params.id}`);
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);
        response.status(500).send('Error deleting hike');
    }
});

export default hikeRouter;
