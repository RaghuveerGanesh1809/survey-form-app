const Form = require('../models/Form');

let lastKanNumber = 0;

const formatKanId = (num) => {
  return `KAN-${String(num).padStart(3, '0')}`;
};

const getNextKanId = async (req, res) => {
  try {
    const lastForm = await Form.findOne().sort({ date: -1 });
    if (lastForm) {
      const lastNum = parseInt(lastForm.kanId.split('-')[1]);
      lastKanNumber = lastNum + 1;
    } else {
      lastKanNumber = 1;
    }
    const newKanId = formatKanId(lastKanNumber);
    res.json({ kanId: newKanId });
  } catch (error) {
    res.status(500).json({ message: "Error getting KAN ID" });
  }
};

const submitForm = async (req, res) => {
  try {
    const newForm = new Form({ ...req.body });
    await newForm.save();
    lastKanNumber += 1;
    res.json({ message: "Form saved", kanId: formatKanId(lastKanNumber) });
  } catch (error) {
    res.status(500).json({ message: "Error saving form", error });
  }
};

module.exports = { getNextKanId, submitForm };
