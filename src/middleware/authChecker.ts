import { NextFunction, Request, Response } from 'express';

import * as UserService from '../services/userService.js';

const authChecker = async (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.session === undefined || (request.session && (request.session.id === undefined || request.session.email === undefined))) {
            return response.status(401).send();
        }

        if (!await UserService.validUser(request.session.email || '')) {
            return response.status(401).send();
        }

        if ((request.originalUrl.startsWith('/hike/deleted') || request.originalUrl.startsWith('/admin')) && request.session.role !== 'Admin') {
            return response.status(403).send();
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        return response.status(500).send('An unexpected error occurred')
    }

    next();
};

export default authChecker;
