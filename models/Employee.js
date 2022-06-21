const { model, Schema } = require("mongoose");

const employee_schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "https://i.pravatar.cc/300",
  },
});

const Employee = model("employee", employee_schema);

module.exports = Employee;
