import express, { Request, Response } from 'express';

import * as UserService from '../services/userService.js';

const authRouter = express.Router();

authRouter.post('/login', async (request: Request, response: Response) => {
    try {
        if (request.body.email === undefined || request.body.password === undefined) {
            response.status(400).send();
            return;
        }

        const result = await UserService.loginUser(request.body.email, request.body.password);

        if (!result.success) {
            response.status(401).send();
            return;
        }

        request.session.email = result.email;
        request.session.role = result.role;
        response.status(200).send({ fullName: result.fullName });
    } catch (error) {
        console.log(error);

        response.status(500).send('Error authenticating user');
    }
});

authRouter.delete('/', async (request: Request, response: Response) => {
    try {
        if (request.session) {
            request.session.destroy((error) => {
                if (error) {
                    console.log(error);

                    response.status(500).send('Error logging out user');
                } else {
                    response.status(200).send();
                }
            });
        }
    } catch (error) {
        console.log(error);

        response.status(500).send('Error logging out user');
    }
});

export default authRouter;
