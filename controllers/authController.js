const db = require("../models");
const config = require("../config/authConfig");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  // Save User to Database

  User.create({
    userID: req.body.userID,
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then(user => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.send({ message: "User registered successfully!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      const token = jwt.sign({ id: user.userID },
                              config.secret,
                              {
                                algorithm: 'HS256',
                                allowInsecureKeySizes: true,
                                expiresIn: 86400, // 24 hours
                              });

      var authorities = [];
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          id: user.userID,
          username: user.username,
          email: user.email,
          roles: authorities,
          accessToken: token
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};


// const signup = async (req, res) => {
//     // Save user to db
//     try {
//         const user = await User.create({
//             userID: req.body.userID,
//             username: req.body.username,
//             email: req.body.email,
//             gender: req.body.gender,
//             password: bcrypt.hashSync(req.body.password, 8),
//             birthdate: req.body.birthdate
//         });

//         if (req.body.roles) {
//             const roles = await Role.findAll({
//                 where: {
//                     name: {
//                         [Op.or]: req.body.roles,
//                     },
//                 },
//             });

//             const result = user.setRoles(roles);
//             if (result) res.send({ message: "User registered successfully!" });
//         } else {
//             //  User has role = 1
//             const result = user.setRoles([1]);
//             if (result) res.send({ message: "User registered successfully!" });
//         }
//     } catch (error) {
//         res.status(500).send({ message: error.message });
//     }
// }

// const signin = async (req, res) => {
//     try {
//         // Check username
//         const user = await User.findOne({
//             where: {
//                 username: req.body.username
//             },
//         });

//         if (!user) {
//             return res.status(404).send({ message: "User Not Found!" });
//         }

//         // Check password
//         const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

//         if (!passwordIsValid) {
//             return res.status(401).send({
//                 message: "Invalid Password!"
//             });
//         }

//         const userJson = user.toJSON()
//         const token = jwt.sign(userJson,
//             config.jwtSecret,
//             {
//                 // algorithm: 'HS256',
//                 // allowInsecureKeySizes: true,
//                 expiresIn: 86400 //24 hours
//             }
//         );

//         let authorities = [];
//         const roles = await user.getRoles();
//         for (let i = 0; i < roles.length; i++) {
//             authorities.push("ROLE_" + roles[i].name.toUpperCase());
//         }

//          req.session.token = token;
//         console.log("successful")
//         return res.status(200).send({
//             user: userJson,
//             // userID: user.userID,
//             // username: user.username,
//             // email: user.email,
//             roles: authorities,
//             token: token

//         });

//     } catch (error) {
//         return res.status(500).send({message: error.message});
//     }
// }

// const signout = async(req,res) => {
//     try{
//         req.session = null;
//         res.clearCookie("token");
//         return res.status(200).send({
//             message: "You've been signed out!!"
//         });
//     }catch(error){
//         this.next(error);
//     }
// }


// module.exports = {
//     signup,
//     signin,
//     signout
// }