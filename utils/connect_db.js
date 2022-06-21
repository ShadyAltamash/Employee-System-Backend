const mongoose = require("mongoose");

const connect_db = async () => {
  try {
    let connected = await mongoose.connect(
      "mongodb+srv://Sumit:2146255sb8@cluster0.0wij2.mongodb.net/employee_system"
    );
    return connected;
  } catch (e) {
    return false;
  }
};

module.exports = connect_db;
