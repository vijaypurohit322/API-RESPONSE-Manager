const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  const { responseId, comment } = req.body;
  try {
    const newComment = new Comment({
      response: responseId,
      user: req.user.id,
      comment,
    });
    const savedComment = await newComment.save();
    res.json(savedComment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ response: req.params.responseId });
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
