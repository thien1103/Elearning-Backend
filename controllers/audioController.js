const { google } = require("googleapis");
const multer = require('multer')
const fs = require('fs')



const getAudio = async (req, res) => {
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
    res.status(500).json({ error: 'Internal Server Error huhu' });
  }
};

const GOOGLE_API_FOLDER_ID = '1UVGaKmsT__kuYhp3UUYwlDFqb5zGbNwr';

const upload = multer({ dest: 'uploads/' });

const uploadAudio = async(req,res)=>{
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
    upload.single('audioFile')(req, res, async (err) => {
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
        console.error('Upload file error', error);
        res.status(500).send('Internal Server Error');
      }
    });
  } catch (error) {
    console.error('Auth error', error);
    res.status(500).send('Auth Error');
  }
}

const deleteAudio = async(req,res) =>{
  try{
    const fileId = req.params.fileId

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

    res.status(200).json({ message: `File with ID ${fileId} deleted successfully.` });
  }catch(error){
    console.error('API error', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const API_KEY_PATH = "./googlekey.json";

const getDriveData = async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const auth = new google.auth.GoogleAuth({
      keyFile: API_KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const driveService = google.drive({
      version: "v3",
      auth,
    });

    const response = await driveService.files.get({
      fileId,
      fields: "id, name, mimeType",
    });

    const file = response.data;
    res.json({ file });
  } catch (error) {
    console.error("Error retrieving data from Google Drive", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getAudio, getDriveData,uploadAudio,deleteAudio};
