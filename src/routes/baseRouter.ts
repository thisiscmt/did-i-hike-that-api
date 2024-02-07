import express, { Request, Response } from 'express';

const baseRouter = express.Router();

baseRouter.get('/', (_request: Request, response: Response) => {
  response.status(200).send('Did I Hike That? API');
});

export default baseRouter;
