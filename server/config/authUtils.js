const jwt = require('jsonwebtoken');
const { jwt: { userSecret,adminSecret} } = require('./secret');

// function generateAdminToken(user) {
//   return jwt.sign(
//     {
//       userId: user._id,
//       username: user.username,
//       role: user.role
//     },
//     adminSecret,
//     { expiresIn: '24h' }
//   );
// }

// function verifyAdminToken(token) {
//   return jwt.verify(token, adminSecret);
// }

function generateUserToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        username: user.username,
         role: user.role,
         minerId: user.minerId
       
      },
      userSecret,
      
    );
  }

function verifyUserToken(token) {
    return jwt.verify(token, userSecret);
  } 


  function generateUserAdminToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
       
      },
      adminSecret,
      
    );
  }

  function verifyUserAdminToken(token) {
    return jwt.verify(token, adminSecret);
  } 



module.exports = {
  generateUserAdminToken,
  verifyUserAdminToken,
  generateUserToken,
  verifyUserToken
};
