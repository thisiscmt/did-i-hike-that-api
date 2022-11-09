import {NextFunction, Request, Response} from 'express';
import { v4 as uuidv4 } from 'uuid';

const authChecker = (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.headers['dihtauth'] === undefined || request.headers['dihtauth'] !== process.env.DIHT_Auth_Header) {
            return response.status(403).send('The request is not authorized');
        }

        if (request.path === '/' && request.method === 'POST') {
            request.fileUploadId = uuidv4();
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        return response.status(500).send('An unexpected error occurred')
    }

    next();
};

export default authChecker;
