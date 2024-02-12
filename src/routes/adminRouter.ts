import express, { Request, Response } from 'express';

import authChecker from '../middleware/authChecker.js';
import * as UserService from '../services/userService.js';

const adminRouter = express.Router();

adminRouter.use(authChecker);

adminRouter.get('/user', async (_request: Request, response: Response) => {
    try {
        const users = await UserService.getUsers();

        response.contentType('application/json');
        response.status(200).send(users);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving users');
    }

    response.status(200).send();
});

adminRouter.get('/user/:id', async (request: Request, response: Response) => {
    try {
        const user = await UserService.getUser(request.params.id);

        response.contentType('application/json');
        response.status(200).send(user);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving user');
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

adminRouter.put('/user/:id', async (request: Request, response: Response) => {
    try {
        let newName: string | undefined;
        let newEmail: string | undefined;
        let newPassword: string | undefined;
        let newRole: string | undefined;

        const currentUser = await UserService.getUser(request.params.id);

        if (currentUser) {
            if (request.body.name) {
                newName = request.body.name.trim();
            }

            if (request.body.email) {
                const existingUser = await UserService.getUserByEmail(request.body.email.trim());

                if (request.body.email !== currentUser.email && existingUser) {
                    response.status(400).send('Email address already in use');
                    return;
                }

                newEmail = request.body.email.trim();
            }

            if (request.body.password) {
                newPassword = request.body.password;
            }

            if (request.body.role) {
                newRole = request.body.role.trim();
            }

            if (newName || newEmail || newPassword || newRole) {
                await UserService.updateUser(currentUser, newName, newEmail, newPassword, newRole);
            }

            response.status(200).send();
        } else {
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);
        response.status(500).send('Error updating user');
    }
});

export default adminRouter;
