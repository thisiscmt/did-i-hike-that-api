import {NextFunction, Request, Response} from 'express';

const hikeValidation = (request: Request, response: Response, next: NextFunction) => {
    try {
        if (request.headers['x-diht-trail'] === undefined ||
                request.headers['x-diht-trail'] === '' ||
                request.headers['x-diht-date-of-hike'] === undefined ||
                request.headers['x-diht-date-of-hike'] === '') {
            response.status(400).send('Missing required input');
            return;
        }
    } catch (error) {
        // TODO: Log this somewhere
        console.log(error);

        return response.status(500).send('An unexpected error occurred')
    }

    next();
};

export default hikeValidation;
