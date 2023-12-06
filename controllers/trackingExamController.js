const db = require('../models');
const { QueryTypes } = require('sequelize');

const TrackingExam = db.trackingExam;


// 1. Lưu giá trị vào bên trong TrackingExam
const createTrackingExam = async (req, res) => {
    try {
      const trackingExamData = req.body;
  
      // Validate if the request body is an array
      if (!Array.isArray(trackingExamData)) {
        return res.status(400).send('Invalid request body. Expecting an array.');
      }
  
      // Iterate over the array and create questionHistory records
      const createdTrackingExam = await Promise.all(
        trackingExamData.map(async (questionData) => {
          return await TrackingExam.create({
            userID: questionData.userID,
            questionID: questionData.questionID,
            examID: questionData.examID,
            selectedAnswer: questionData.selectedAnswer,
            turnID: questionData.turnID
          });
        })
      );
  
      res.status(200).json(createdTrackingExam);
    } catch (err) {
      res.status(500).send(`An error occurred while creating trackingExam: ${err.message}`);
    }
  };


  module.exports = {
    createTrackingExam
  }