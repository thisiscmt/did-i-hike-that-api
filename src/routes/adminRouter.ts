import express, { Request, Response } from 'express';

import authChecker from '../middleware/authChecker.js';
import * as UserService from '../services/userService.js';
import * as SessionService from '../services/sessionService.js';

const adminRouter = express.Router();
adminRouter.use(authChecker);

adminRouter.get('/user', async (_request: Request, response: Response) => {
    try {
        const users = await UserService.getUsers();
        response.status(200).send(users);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving users');
    }
});

adminRouter.get('/user/:id', async (request: Request, response: Response) => {
    try {
        const user = await UserService.getUser(request.params.id);

        if (user) {
            response.status(200).send(user);
        } else {
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving user');
    }
});

adminRouter.post('/user', async (request: Request, response: Response) => {
    try {
        if (request.body.fullName === undefined || request.body.email === undefined || request.body.password === undefined || request.body.role === undefined) {
            response.status(400).send();
            return;
        }

        await UserService.createUser(request.body.fullName, request.body.email, request.body.password, request.body.role);
        response.status(201).send();
    } catch (error) {
        console.log(error);
        response.status(500).send('Error creating user');
    }
});

adminRouter.put('/user/:id', async (request: Request, response: Response) => {
    try {
        let newName: string | undefined;
        let newEmail: string | undefined;
        let newPassword: string | undefined;
        let newRole: string | undefined;

        const currentUser = await UserService.getUser(request.params.id);

        if (currentUser) {
            if (request.body.fullName) {
                newName = request.body.fullName.trim();
            }

            if (request.body.email) {
                const existingUser = await UserService.getUserByEmail(request.body.email.trim());

                if (request.body.email !== currentUser.email && existingUser) {
                    response.status(400).send('The email address is already in use');
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

adminRouter.delete('/user/:id', async (request: Request, response: Response) => {
    try {
        if (await UserService.userExists(request.params.id)) {
            await UserService.deleteUser(request.params.id);

            response.status(204).send();
        } else {
            console.log(`Attempted deletion of a missing user: ${request.params.id}`);
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);

        response.status(500).send('Error deleting user');
    }
});

adminRouter.get('/session', async (_request: Request, response: Response) => {
    try {
        const sessions = await SessionService.getSessions();
        response.status(200).send(sessions);
    } catch (error) {
        console.log(error);
        response.status(500).send('Error retrieving sessions');
    }
});

adminRouter.delete('/session/:id', async (request: Request, response: Response) => {
    try {
        if (await SessionService.sessionExists(request.params.id)) {
            await SessionService.deleteSession(request.params.id);

            response.status(204).send();
        } else {
            console.log(`Attempted deletion of a missing session: ${request.params.id}`);
            response.status(404).send();
        }
    } catch (error) {
        console.log(error);
        response.status(500).send('Error deleting session');
    }
});

export default adminRouter;
