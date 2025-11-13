import express, { Request, Response } from 'express';

import authChecker from '../middleware/authChecker.js';
import * as HikeService from '../services/hikeService.js';

const tagRouter = express.Router();

tagRouter.use(authChecker);

tagRouter.get('/', async (_request: Request, response: Response) => {
    try {
        const tags = await HikeService.getTags();

        response.status(200).send(tags);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving tags');
    }
});

export default tagRouter;
