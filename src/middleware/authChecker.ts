import { NextFunction, Request, Response } from 'express';

import * as DataService from '../services/dataService.js';
import { USER_SESSION_COOKIE } from '../constants/constants.js';

const authChecker = async (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.cookies === undefined || (request.cookies && request.cookies[USER_SESSION_COOKIE] === undefined) || request.headers['x-diht-user'] === undefined) {
            return response.status(401).send();
        }

        if (!await DataService.validateUser(request.headers['x-diht-user'].toString(), request.cookies[USER_SESSION_COOKIE])) {
            return response.status(401).send();
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        return response.status(500).send('An unexpected error occurred')
    }

    next();
};

export default authChecker;
