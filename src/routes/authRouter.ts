import express, { Request, Response } from 'express';

import * as UserService from '../services/userService.js';
import * as Constants from '../constants/constants.js';

const authRouter = express.Router();

authRouter.post('/login', async (request: Request, response: Response) => {
    try {
        if (request.body.email === undefined || request.body.password === undefined) {
            response.status(400).send('Missing required parameters');
            return;
        }

        const result = await UserService.loginUser(request.body.email, request.body.password);

        if (!result.success) {
            response.status(401).send('The email address or password was invalid');
            return;
        }

        request.session.email = result.email;
        request.session.role = result.role;
        request.session.userId = result.userId;

        response.status(200).send({ fullName: result.fullName, role: result.role });
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
                    response.clearCookie(Constants.SESSION_COOKIE_NAME);
                    response.status(204).send();
                }
            });
        }
    } catch (error) {
        console.log(error);

        response.status(500).send('Error logging out user');
    }
});

export default authRouter;
