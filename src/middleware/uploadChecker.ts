import {NextFunction, Request, Response} from 'express';
import {v4 as uuidv4} from 'uuid';

const uploadChecker = (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.headers['content-type']?.startsWith('multipart/form-data') && (request.method === 'POST' || request.method === 'PUT')) {
            request.fileUploadId = uuidv4();
        }
    } catch (error) {
        console.log(error);
        return response.status(500).send('An unexpected error occurred')
    }

    next();
};

export default uploadChecker;
