import {NextFunction, Request, Response} from 'express';
import { v4 as uuidv4 } from 'uuid';

const authChecker = (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.headers['x-diht-agent'] === undefined || request.headers['x-diht-agent'] !== process.env.DIHT_Agent_Header) {
            return response.status(403).send('The request is not authorized');
        }

        if (request.headers['content-type']?.startsWith('multipart/form-data') && (request.method === 'POST' || request.method === 'PUT')) {
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
