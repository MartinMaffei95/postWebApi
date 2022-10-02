const verifyToken = (req, res, next) => {
  const autorization_header = req.headers['authorization'];
  if (autorization_header !== undefined) {
    const token = autorization_header.split(' ')[1];
    req.token = token;
    next();
  } else {
    res.status(401).json({
      message: 'TOKEN_NOT_FOUND',
    });
  }
};

exports.verifyToken = verifyToken;
