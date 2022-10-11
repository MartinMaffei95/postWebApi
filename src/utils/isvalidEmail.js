const isValidEmail = (mail) => {
  if (mail.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) return true;
  else return false;
};

exports.isValidEmail = isValidEmail;
