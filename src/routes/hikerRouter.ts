import express, { Request, Response } from 'express';

import authChecker from '../middleware/authChecker.js';
import * as HikeService from '../services/hikeService.js';
import { Hiker } from '../db/models/hiker.js';

const hikerRouter = express.Router();

hikerRouter.use(authChecker);

hikerRouter.get('/', async (_request: Request, response: Response) => {
    try {
        const hikers = await HikeService.getHikers();

        response.contentType('application/json');
        response.status(200).send(hikers.map((hiker: Hiker) => hiker.fullName));
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error retrieving hikers');
    }
});

export default hikerRouter;
