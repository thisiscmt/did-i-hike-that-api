// import express from  'express';
// import multer from 'multer';
// import fs from 'fs';
// import path, {dirname} from 'path';
// import {fileURLToPath} from 'url';
//
// import storage from '../middleware/upload.js';
// import {getDatabase, getDBConfig} from '../utils/databaseUtils.js';
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const momentRouter = express.Router();
//
// const upload = multer(
//     {
//         dest: 'data',
//         limits: {
//             fieldNameSize: 100,
//             fileSize: 60000000
//         },
//         storage: storage
//     }
// ).single('file');
//
// momentRouter.use(async (request, response, next) => {
//     try {
//         delete request.currentUserId;
//
//         if (request.headers.authorization) {
//             const { user } = getDatabase(getDBConfig());
//
//             let userRecord = await user.findOne({
//                 where: {
//                     userName: request.headers.authorization
//                 }
//             });
//
//             if (!userRecord) {
//                 userRecord = await user.create({
//                     userName: request.headers.authorization,
//                     // TODO
//                     firstName: 'John',
//                     lastName: 'Doe',
//                     lastLogin: new Date()
//                 });
//             }
//
//             request.currentUserId = userRecord.id;
//         } else {
//             return response.status(403).send('Missing credentials');
//         }
//     } catch (error) {
//         // TODO: Log this somewhere
//         console.log(error);
//
//         return response.status(500).send('An unexpected error occurred')
//     }
//
//     next();
// });
//
// momentRouter.get('/', async (request, response) => {
//     const { moment, photo } = getDatabase(getDBConfig());
//     const data = {};
//
//     const momentRecords = await moment.findAll({
//         attributes: ['id', 'comment', 'tags', 'userId', 'createdAt', 'updatedAt'],
//         where: {
//             userId: request.currentUserId
//         }
//     });
//
//     if (request.query.includeImages !== undefined && request.query.includeImages.toLowerCase() === 'true') {
//         data.moments = [];
//
//         momentRecords.forEach(async (item) => {
//             let newMoment;
//
//             const imageRecords = await photo.findAll({
//                 attributes: ['filePath'],
//                 where: {
//                     momentId: moment.id
//                 }
//             });
//
//             imageRecords.forEach(rec => {
//                 images.push({
//                     path: `images/${rec.filePath}`
//                 });
//
//                 const newMoment = { ...moment };
//                 newMoment.images = images;
//             })
//         });
//
//
//         data.moments = momentRecords.map((moment) => {
//             let newMoment;
//
//             const imageRecords = await photo.findAll({
//                 attributes: ['filePath'],
//                 where: {
//                     momentId: moment.id
//                 }
//             }).then(imageRecords => {
//                 const images = [];
//
//                 imageRecords.forEach(rec => {
//                     images.push({
//                         path: `images/${rec.filePath}`
//                     });
//                 });
//
//                 const newMoment = { ...moment };
//                 newMoment.images = images;
//             })
//
//             return newMoment;
//         });
//     } else {
//         data.moments = momentRecords;
//     }
//
//     response.contentType('application/json');
//     response.send(data);
// });
//
// momentRouter.get('/:id', async (request, response) => {
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
//
// momentRouter.post('/', (request, response) => {
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
//
// export default momentRouter;
