import express, { Request, Response } from 'express';
import path from 'path';
import { open } from 'node:fs/promises';

import authChecker from '../middleware/authChecker.js';
import * as UserService from '../services/userService.js';
import * as SessionService from '../services/sessionService.js';
import * as SharedService from '../services/sharedService.js';
import * as Constants from '../constants/constants.js';

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

adminRouter.get('/log', async (request: Request, response: Response) => {
    try {
        const page = request.query.page ? Number(request.query.page) : 1;
        const pageSize = request.query.pageSize ? Number(request.query.pageSize) : 20;
        const logFilePath = `${path.join(process.cwd(), Constants.LOG_FILE_NAME)}`;
        const logFileExists = await SharedService.fileExists(logFilePath);

        if (logFileExists) {
            const file = await open(logFilePath);
            const startingLine = (page - 1) * pageSize;
            let logData = '';
            let lineNumber = 0;

            for await (const line of file.readLines()) {
                if (lineNumber < startingLine ) {
                    lineNumber += 1;
                    continue;
                }

                if (lineNumber > (startingLine + (pageSize - 1))) {
                    break;
                }

                logData += `${line},`;
                lineNumber += 1;
            }

            if (logData.endsWith(',')) {
                logData = logData.slice(0, -1);
            }

            response.status(200).send(`{"rows":[${logData}]}`);
        } else {
            response.status(200).send(`{"rows":[]}`);
        }
    } catch (error) {
        request.app.locals.logger.error(error);
        response.status(500).send('An error occurred while retrieving log data');
    }
});

adminRouter.post('/log', async (request: Request, response: Response) => {
    try {
        let status = 200;

        if (request.body.errorData) {
            request.app.locals.logger.error(`A browser error occurred: ${request.body.errorData}`);
            status = 201;
        }

        response.status(status).send();
    } catch (error) {
        request.app.locals.logger.error(error);
    }
});

export default adminRouter;
