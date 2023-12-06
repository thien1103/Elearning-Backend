const db = require('../models');
const { QueryTypes } = require('sequelize');

const User = db.user;


const allAccess = (req,res) => {
    res.status(200).send("Public Content.");
}

const userBoard = (req,res) => {
    res.status(200).send("User Content");

}

const adminBoard = (req,res) => {
    res.status(200).send("Admin Content");
}


// const getUserInfo = async(req,res) => {
//     try{
//         const userID = req.params.userID;
//         const query = `SELECT username, email FROM users WHERE userID = :userID`
//       const user = await db.sequelize.query(query, {
//         replacements: { userID: userID },
//         type: QueryTypes.SELECT,
//       });
//       res.status(200).json(user);
//     }catch(error){
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// }

module.exports = {
    allAccess,
    userBoard,
    adminBoard

}