import express, {Request, Response} from 'express';

import authChecker from '../middleware/authChecker.js';

const errorRouter = express.Router();

errorRouter.use(authChecker);

errorRouter.post('/', async (request: Request, response: Response) => {
    try {
        if (request.body.errorData) {
            console.log('A browser error occurred: %o: ', request.body.errorData);
        }
    } catch (error) {
        // TODO
    }

    response.status(200).send();
});

export default errorRouter;
