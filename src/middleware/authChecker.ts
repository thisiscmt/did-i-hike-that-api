import {NextFunction, Request, Response} from 'express';

const authChecker = (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.headers['x-diht-agent'] === undefined || request.headers['x-diht-agent'] !== process.env.DIHT_ALLOWED_USER_AGENT) {
            return response.status(403).send('The request is not authorized');
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        return response.status(500).send('An unexpected error occurred')
    }

    next();
};

export default authChecker;
