const { model, Schema } = require("mongoose");

const admin_schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Admin = model("admin", admin_schema);

module.exports = Admin;
