import express from  'express';

const baseRouter = express.Router();

baseRouter.get('/', function(request, response) {
  response.status(200).send('Did I Hike That? API');
});

export default baseRouter;
