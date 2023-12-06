const db = require('../models');
const { QueryTypes } = require('sequelize');

const Exam = db.exams;
const Answer = db.answers;
const Question = db.questions;

// 1. Create product
const createExam = async (req, res) => {
  try {
    let info = {
      examID: req.body.examID,
      title: req.body.title,
      duration: req.body.duration,
      numberQuestion: req.body.numberQuestion,
      examStatus: req.body.examStatus
    };

    const exam = await Exam.create(info);
    res.status(200).send(exam);
    console.log(exam);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while creating the exam.');
  }
};

// 2. Get all exam
const getAllExams = async (req, res) => {
  const exams = await Exam.findAll({});
  res.send(exams);
}

const getExam = async (req, res) => {
  try {
    const examid = req.params.examID; 
    const exam = await Exam.findByPk(examid);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.status(200).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while retrieving the exam.' });
  }
};

// 2.UpdateExam
const updateExam = async (req, res) => {
  try {
    const id = req.params.id;
    const [updatedCount] = await Exam.update(req.body, { where: { examID: id } });

    if (updatedCount === 0) {
      console.log(`Exam with ID ${id} does not exist.`);
      return res.status(404).send(`Exam with ID ${id} does not exist.`);
    }

    res.status(200).send(`Exam with ID ${id} is updated`);
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred while updating the exam.');
  }
}

//3.Delete Exam
const deleteExam = async (req, res) => {
  try {
    const id = req.params.examID;

    const isExamID = await Exam.findByPk(id)
    if(!isExamID){
      return res.status(400).send('Invalid or non-existent examID.');
    }
    // Nếu xóa  Exam thì cần xóa Question và cả Answer bên trong.
    const deletedAnswer = await  Answer.destroy({where: {examID: id}})

    const deletedQuestion = await Question.destroy({where: {examID: id}});

    const deletedExam = await Exam.destroy({ where: { examID: id } });

    if (deletedExam === 0 && deletedQuestion === 0 && deletedAnswer === 0) {
      console.log(`Exam with ID ${id} does not exist.`);
      return res.status(404).send(`Exam with ID ${id} does not exist.`);
    }

    res.status(200).send('Exam is deleted');
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred while deleting the exam.');
    
  }

}

const getDuration = async(req,res) =>{
  try{
    const examID = req.params.examID
    const queryDuration = "SELECT duration FROM exams WHERE examID = :examID"
    const duration = await db.sequelize.query(queryDuration, {
      replacements: {examID: examID },
      type: QueryTypes.SELECT,
    });

  if (!duration) {
    return res.status(404).json({ message: 'Duration not found' });
  }
  res.status(200).json(duration);
  }catch(error){
    res.status(500).send("Get Duration error: ",error);
  }
}



module.exports = {
  createExam,
  getAllExams,
  updateExam,
  deleteExam,
  getExam,
  getDuration
}