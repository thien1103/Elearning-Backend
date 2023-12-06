const { google } = require("googleapis");
const fs = require('fs')
const db = require("../models");
const { QueryTypes } = require("sequelize");
const multer = require("multer");


const upload = multer({ dest: 'uploads/' });

const User = db.user;
const Profile = db.profile;

const GOOGLE_API_FOLDER_ID = '1UVGaKmsT__kuYhp3UUYwlDFqb5zGbNwr';


const uploadImage = async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './googlekey.json',
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const driveService = google.drive({
      version: 'v3',
      auth,
    });

    // Multer middleware to handle file upload
    upload.single('imageFile')(req, res, async (err) => {
      if (err) {
        console.error('Multer error', err);
        return res.status(500).send('Multer Error');
      }

      try {
        const fileMetaData = {
          name: req.file.originalname,
          parents: [GOOGLE_API_FOLDER_ID],
        };

        const media = {
          mimeType: req.file.mimetype,
          body: fs.createReadStream(req.file.path),
        };

        const response = await driveService.files.create({
          resource: fileMetaData,
          media: media,
          fields: 'id',
        });

        // Remove the temporarily uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({ fileId: response.data.id });
      } catch (error) {
        console.error('Upload image error', error);
        res.status(500).send('Internal Server Error');
      }
    });
  } catch (error) {
    console.error('Auth error', error);
    res.status(500).send('Auth Error');
  }
};

const getImage = async (req, res) => {
  const fileID = req.params.fileID;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./googlekey.json",
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const driveService = google.drive({
      version: "v3",
      auth: await auth.getClient(),
    });

    // Use await to wait for the asynchronous request to complete
    const response = await driveService.files.get(
      { fileId: fileID, alt: 'media' },
      { responseType: 'stream' }
    );

    // Pipe the response data to the Express response
    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const saveImage = async(req,res)=>{
  try{
    const userID = req.params.userID;
    const fileID  = req.params.fileID;
    const query = `
      UPDATE userprofiles
      SET image = :fileID
      WHERE userID = :userID
    `;

    const [updatedRows] = await db.sequelize.query(query, {
      replacements: {
        userID: userID,
        fileID: fileID,
      },
      type: db.sequelize.QueryTypes.UPDATE,
    });

    if (updatedRows === 0) {
      console.log(`User with ID ${userID} does not exist.`);
      return res.status(404).send(`User with ID ${userID} does not exist.`);
    }

    res.status(200).send(`User with ID ${userID} is updated`);
  }catch(error){
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error huhu' });
  }
}

const deleteImage = async (req, res) => {
  try {
    const fileId = req.params.fileID;

    if (!fileId) {
      return res.status(400).json({ error: 'Missing fileId in request body' });
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: './googlekey.json',
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const driveService = google.drive({
      version: 'v3',
      auth,
    });

    // Delete the file by fileId
    await driveService.files.delete({
      fileId: fileId,
    });

    res.status(200).json({ message: `Image with ID ${fileId} deleted successfully.` });
  } catch (error) {
    console.error('Delete image error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getFileID = async(req,res)=>{
  try{
    const userID = req.params.userID;
    const query = `
      SELECT image FROM userprofiles WHERE userID = :userID
    `;
    const fileID = await db.sequelize.query(query, {
      replacements: { userID: userID },
      type: QueryTypes.SELECT,
    });
    res.status(200).json(fileID);
  }catch(error){
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const getProfileUser = async (req, res) => {
  try {
    
    const userID = req.params.userID;
    const query = `SELECT profileID,userprofiles.userID,firstName,lastName,gender,phone,city,country,image, users.username,users.email FROM userprofiles 
    LEFT JOIN users ON userprofiles.userID = users.userID
    WHERE users.userID = :userID`;
    const profile = await db.sequelize.query(query, {
      replacements: { userID: userID },
      type: QueryTypes.SELECT,
    });
    res.status(200).json(profile[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};




const createProfileUser = async (req, res) => {
  try {
    const userID = req.params.userID;
    const user = await User.findByPk(userID);

    if (!user) {
      console.log(`User with ID ${userID} does not exist.`);
      return res.status(404).send(`User with ID ${userID} does not exist.`);
    }

    const profile = await Profile.create({ userID: user.userID });
    res.status(200).send(profile);
    console.log(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};

//2. Chức năng edit profile
const editProfileUser = async (req, res) => {
  try {
    const userID = req.params.userID;
    const { firstName, lastName, phone, city, country, gender } = req.body;

    const query = `
      UPDATE userprofiles
      SET firstName = :firstName, lastName = :lastName, phone = :phone, city = :city, country = :country, gender = :gender
      WHERE userID = :userID
    `;

    const [updatedRows] = await db.sequelize.query(query, {
      replacements: {
        userID: userID,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        city: city,
        country: country,
        gender: gender,
      },
      type: db.sequelize.QueryTypes.UPDATE,
    });

    if (updatedRows === 0) {
      console.log(`User with ID ${userID} does not exist.`);
      return res.status(404).send(`User with ID ${userID} does not exist.`);
    }

    res.status(200).send(`User with ID ${userID} is updated`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred ", error });
  }
};

  const getHistoryProfile = async(req,res)=>{
    try{
      const userID = req.params.userID;
      const query = `SELECT exams.title,exams.examID, exams.duration, results.score , exams.examStatus, results.turnID
      FROM exams 
      LEFT JOIN results ON exams.examID = results.examID
      WHERE results.userID = :userID`
      const history = await db.sequelize.query(query, {
        replacements: { userID: userID },
        type: QueryTypes.SELECT,
      });
      res.status(200).json(history);
    }catch(error){
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  const getTotalTimeTakeQuiz = async(req,res)=>{
    try{
      const userID = req.params.userID;
      const query = `SELECT COUNT(*) AS totalTurns
      FROM exams 
      LEFT JOIN results ON exams.examID = results.examID
      WHERE results.userID = :userID;`
      const history = await db.sequelize.query(query, {
        replacements: { userID: userID },
        type: QueryTypes.SELECT,
      });
      res.status(200).json(history[0].totalTurns);
    }catch(error){
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  


module.exports = {
  createProfileUser,
  getProfileUser,
  editProfileUser,
  uploadImage,
  saveImage,
  getImage,
  deleteImage,
  getFileID,
  getHistoryProfile,
  getTotalTimeTakeQuiz
};
