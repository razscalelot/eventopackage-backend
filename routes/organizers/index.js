let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const agentModel = require('../../models/agents.model');
const { default: mongoose } = require("mongoose");
router.post('/checkagent', async (req, res) => {
  let primary = mongoConnection.useDb(constants.DEFAULT_DB);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { agentid } = req.body;
  if (agentid && agentid != '' && mongoose.Types.ObjectId.isValid(agentid)) {
    let agentData = await primary.model(constants.MODELS.agents, agentModel).findById(agentid).select('-password').lean();
    if (agentData && agentData.status == true && agentData.is_approved && agentData.mobileverified == true) {
      return responseManager.onSuccess('Agent is approved data is here...!', agentData, res);
    } else {
      return responseManager.badrequest({ message: 'Invalid Agent id, Please try again with valid id...' }, res);
    }
  } else {
    return responseManager.badrequest({ message: 'Invalid Agent id, Please try again with valid id...' }, res);
  }
});
module.exports = router;