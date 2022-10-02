const { isValidID } = require('../utils/isValidId');

const verifyID = (req, res, next) => {
  const id = req.params.id;

  if (id === '') {
    return res.status(401).json({
      message: 'EMPTY_ID',
      id: postID,
    });
  }

  if (!isValidID(id) || id === null) {
    return res.status(404).json({
      message: 'INVALID_ID',
      id: id,
    });
  }

  next();
};

exports.verifyID = verifyID;
