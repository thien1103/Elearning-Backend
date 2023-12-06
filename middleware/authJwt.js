const jwt = require("jsonwebtoken");
const config = require("../config/authConfig");
const db = require("../models");
const User = db.user;

// verifyToken = (req,res,next) => {
//     let token = req.session.token;
//     if(!token){
//         return res.status(403).send({
            
//             message: "No token provided!"
//         });
//     }

//     jwt.verify(token,config.secret,(err, decoded) =>{
//         if(err){
//             return res.status(401).send({
//                 message: "Unauthorized!"
//             });
//         }
//         req.userID = decoded.id;
//         next();
//     });
// };
verifyToken = (req, res, next) => {
    //  Lấy từ Token từ header x-access-token
    let token = req.headers["x-access-token"];
  
    // check xem không có token thì trả về lỗi
    if (!token) {
      return res.status(403).send({
        message: "No token provided!"
      });
    }
  
    // Thực hiện lấy private key để decoded token
    jwt.verify(token,
              config.secret,
              (err, decoded) => {
                //Decode mà error --> cook
                if (err) {
                  return res.status(401).send({
                    message: "Unauthorized!",
                  });
                }
                // trả về userID sau khi đã decode.
                req.userId = decoded.id;
                next();
              });
  };
  



isAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }
        }
  
        res.status(403).send({
          message: "Require Admin Role!"
        });
        return;
      });
    });
};
// isAdmin = async(req, res , next) => {
//     try{
//         const user = await User.findByPk(req.userID);
//         const roles = await user.getRoles();
        
//         for(let i = 0;i <roles.length;i++){
//             if(roles[i].name === "admin"){
//                 return next();
//             }
//         }

//         return res.status(403).send({
//             message: "Require Admin Role!"
//         });

//     }catch(error){
//         return res.status(500).send({
//             message: "Unable to validate User Role!"
//         });
//     }
// };


const authJwt = {
    verifyToken,
    isAdmin
};

module.exports = authJwt;