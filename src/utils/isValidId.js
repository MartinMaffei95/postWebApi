const isValidID = (id) => {
  console.log(id);
  if (id.match(/^[0-9a-fA-F]{24}$/)) return true;
  else return false;
};

exports.isValidID = isValidID;
