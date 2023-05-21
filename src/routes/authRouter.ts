import express, {Request, Response} from 'express';

import * as DataService from '../services/dataService.js';
import authChecker from '../middleware/authChecker.js';

const authRouter = express.Router();

authRouter.post('/login', async (request: Request, response: Response) => {
    try {
        if (request.body.email === undefined || request.body.password === undefined) {
            response.status(400).send();
            return;
        }

        const success = await DataService.loginUser(request.body.email, request.body.password);

        if (!success) {
            response.status(401).send();
            return;
        }

        request.session.email = request.body.email;
        response.status(200).send();
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error authenticating user');
    }
});

authRouter.post('/', authChecker, async (request: Request, response: Response) => {
    try {
        if (request.body.name === undefined || request.body.email === undefined || request.body.password === undefined) {
            response.status(400).send();
            return;
        }

        await DataService.createUser(request.body.name, request.body.email, request.body.password);
        response.status(201).send();
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error creating user');
    }
});

authRouter.delete('/', async (request: Request, response: Response) => {
    try {
        if (request.session) {
            request.session.destroy((error) => {
                if (error) {
                    // TODO: Log this somewhere
                    console.log(error);

                    response.status(500).send('Error logging out user');
                } else {
                    response.status(200).send();
                }
            });
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        response.status(500).send('Error authenticating user');
    }
});

export default authRouter;
