import express, {Request, Response} from 'express';

import * as DataService from '../services/dataService.js';

const authRouter = express.Router();

authRouter.get('/login', async (request: Request, response: Response) => {
    try {
        if (request.query.email === undefined || request.query.password === undefined) {
            response.status(400).send();
            return;
        }

        const success = await DataService.loginUser(request.query.email.toString(), request.query.password.toString());

        if (!success) {
            response.status(401).send();
            return;
        }

        request.session.email = request.query.email.toString();
        response.status(200).send();
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error authenticating user');
    }
});

export default authRouter;
