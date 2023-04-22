import express from  'express';

const baseRouter = express.Router();

baseRouter.get('/', function(request, response) {
  response.send('Did I Models That? API');
});

export default baseRouter;
