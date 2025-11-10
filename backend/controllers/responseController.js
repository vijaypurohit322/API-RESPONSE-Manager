const ApiResponse = require('../models/ApiResponse');

exports.createResponse = async (req, res) => {
  const {
    projectId,
    requestMethod,
    requestUrl,
    requestHeaders,
    requestBody,
    responseStatusCode,
    responseHeaders,
    responseBody,
  } = req.body;
  try {
    const newResponse = new ApiResponse({
      project: projectId,
      requestMethod,
      requestUrl,
      requestHeaders,
      requestBody,
      responseStatusCode,
      responseHeaders,
      responseBody,
    });
    const response = await newResponse.save();
    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getResponses = async (req, res) => {
  try {
    const responses = await ApiResponse.find({ project: req.params.projectId });
    res.json(responses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
