import express from  'express';

const baseRouter = express.Router();

baseRouter.get('/', function(req, res) {
  res.send("Did I Hike That? API");
});

export default baseRouter;
