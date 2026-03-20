// import express, {Request, Response} from 'express';
// import fs from 'node:fs/promises';
//
// import authChecker from '../middleware/authChecker.js';
// import * as Constants from '../constants/constants.js';
//
// const logRouter = express.Router();
//
// logRouter.use(authChecker);
//
// logRouter.get('/', async (request: Request, response: Response) => {
//     try {
//         const logData = await fs.readFile(`/${Constants.LOG_FILE_NAME}`, { encoding: 'utf8' });
//         const logResponse = `{ logData: [${logData}] }`;
//
//         response.status(200).send(logResponse);
//     } catch (error) {
//         request.app.locals.logger.error(error);
//         response.status(500).send('An error occurred while retrieving log data');
//     }
// });
//
// logRouter.post('/', async (request: Request, response: Response) => {
//     try {
//         let status = 200;
//
//         if (request.body.errorData) {
//             request.app.locals.logger.error(`A browser error occurred: ${request.body.errorData}`);
//             status = 201;
//         }
//
//         response.status(status).send();
//     } catch (error) {
//         request.app.locals.logger.error(error);
//     }
// });
//
// export default logRouter;
