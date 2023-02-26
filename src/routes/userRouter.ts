import express, {Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';

import * as DataService from '../services/dataService.js';
import * as SharedService from '../services/sharedService.js';
import {USER_SESSION_COOKIE} from '../constants/constants.js';

const userRouter = express.Router();

userRouter.get('/login', async (request: Request, response: Response) => {
    try {
        if (request.query.email === undefined || request.query.password === undefined) {
            response.status(400).send();
            return;
        }

        const userRecord = await DataService.getUser(request.query.email.toString());

        if (!userRecord) {
            response.status(404).send();
            return;
        }

        if (userRecord.password !== request.query.password.toString()) {
            response.status(401).send();
            return;
        }

        const token = await SharedService.encrypt(uuidv4());
        await DataService.loginUser(userRecord.id, token);

        const secure = process.env.NODE_ENV === 'production';
        const domain = process.env.NODE_ENV === 'production' ? '.cmtybur.com' : undefined;
        response.cookie(USER_SESSION_COOKIE, token, {maxAge: 31536000000, httpOnly: true, secure, domain });
        response.status(200).send();
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error authenticating user');
    }
});

export default userRouter;
