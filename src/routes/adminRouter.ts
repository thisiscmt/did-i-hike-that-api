import express, { Request, Response } from 'express';

import authChecker from '../middleware/authChecker.js';
import * as UserService from '../services/userService.js';

const adminRouter = express.Router();

adminRouter.use(authChecker);

adminRouter.get('/user', async (_request: Request, response: Response) => {
    try {
//        const users = await UserService.getUsers();
//        response.status(200).send(users);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving users');
    }

    response.status(200).send();
});

adminRouter.post('/user', async (request: Request, response: Response) => {
    try {
        if (request.body.name === undefined || request.body.email === undefined || request.body.password === undefined) {
            response.status(400).send();
            return;
        }

        await UserService.createUser(request.body.name, request.body.email, request.body.password, request.body.role);
        response.status(201).send();
    } catch (error) {
        console.log(error);
        response.status(500).send('Error creating user');
    }

    response.status(201).send();
});

adminRouter.put('/user', async (request: Request, response: Response) => {
    try {
//        await UserService.updateUser(request.body.email, request.body.password, request.body.role);
//        response.status(201).send();

    } catch (error) {
        console.log(error);
        response.status(500).send('Error updating user');
    }

    response.status(200).send();
});

export default adminRouter;
