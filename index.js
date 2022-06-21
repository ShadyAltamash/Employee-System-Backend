const express = require("express");
const { google } = require("googleapis");
const keys = require("./keys.json");
const cors = require("cors");
const connect_db = require("./utils/connect_db");
const Employee = require("./models/Employee");
const { connect } = require("mongoose");
const jwt = require("jsonwebtoken");
const verifyUser = require("./utils/verifyUser");
//initialize express
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// database connection

connect_db()
  .then((connection) => {
    if (connection) {
      console.log("Database connected successfully");
    } else {
      console.log("Database connection failed");
    }
  })
  .catch((e) => {
    console.log(e);
  });
// index route
app.get("/", (request, response) => {
  response.send("Backend Working");
});

app.get("/slots/:week", verifyUser,async (req, res) => {
  const {id} = req.user;
  // now find the user with this id

  const employee = await Employee.findOne({_id:id});

  const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  //Auth client Object
  const authClientObject = await auth.getClient();

  const spreadsheetId = "1qLYw4HWU7X1JGKL_5zbGRv7gdoxkWnad8XelqGmNI0M";

  const googleSheetsInstance = google.sheets({
    version: "v4",
    auth: authClientObject,
  });

  const readData = await googleSheetsInstance.spreadsheets.values.get({
    auth, //auth object
    spreadsheetId, // spreadsheet id
    range: `Week${req.params.week}!A:E`, //range of cells to read from.
  });

  const data = readData.data.values;
  let total_count = data.slice(1).filter((emp)=>emp[3]===employee.email);
  res.send(total_count);
});

app.post("/auth", async (req, res) => {
  const { email, name, picture } = req.body;
  // first check is already employee in database or nor
  // if yes then return error

  const employee = await Employee.findOne({ email });
  // if employee is not found in database create one then generated jwt token

  if (employee) {
    const token = jwt.sign({ id: employee._id }, "APP_SECRET");
    res.json({ token });
  } else {
    const employee = new Employee({
      name,
      email,
      avatar: picture,
    });
    const emp = await employee.save();
    const token = jwt.sign({ id: emp._id }, "APP_SECRET");
    res.json({ token });
  }
});

app.get("/auth/user", verifyUser, async (req, res) => {
  const { id } = req.user;
  console.log(id);
  const employee = await Employee.findOne({ _id: id });
  res.json(employee);
});

app.post(
  "/book",
  verifyUser,
  async (req, res, next) => {
    const { id } = req.user;
    const { weekOfMonth, day } = req.body;
    const employee = await Employee.findOne({ _id: id });
    req.employee = employee;
    req.week = weekOfMonth;
    req.day = day;
    next();
  },
  async (request, response) => {
    const auth = new google.auth.GoogleAuth({
      keyFile: "keys.json", //the key file
      //url to spreadsheets API
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    //Auth client Object
    const authClientObject = await auth.getClient();

    //Google sheets instance
    const googleSheetsInstance = google.sheets({
      version: "v4",
      auth: authClientObject,
    });

    // spreadsheet id
    const spreadsheetId = "1qLYw4HWU7X1JGKL_5zbGRv7gdoxkWnad8XelqGmNI0M";

    // Get metadata about spreadsheet
    const sheetInfo = await googleSheetsInstance.spreadsheets.get({
      auth,
      spreadsheetId,
    });

    console.log(request.week);

    //Read from the spreadsheet
    const readData = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId, // spreadsheet id
      range: `Week${request.week}!A:A`, //range of cells to read from.
    });

    if (readData.data.values && readData.data.values.length == 11) {
      //write data into the google sheets
      await googleSheetsInstance.spreadsheets.values.append({
        auth, //auth object
        spreadsheetId, //spreadsheet id
        range: `Week${request.week}!A:E`, //sheet name and range of cells
        valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
        resource: {
          values: [
            [
              request.employee.name,
              request.day,
              "WFH",
              request.employee.email,
              new Date().getTime(),
            ],
          ],
        },
      });
      response.status(200).json({
        message:
          "Slot is Booked for Work from Home as already 10 peoples booked for Work from Office",
      });
    } else {
      //write data into the google sheets
      await googleSheetsInstance.spreadsheets.values.append({
        auth, //auth object
        spreadsheetId, //spreadsheet id
        range: `Week${request.week}!A:E`, //sheet name and range of cells
        valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
        resource: {
          values: [
            [
              request.employee.name,
              request.day,
              "WFO",
              request.employee.email,
              new Date().getTime(),
            ],
          ],
        },
      });
      response
        .status(200)
        .json({ message: "Slot is Booked for Work from Office" });
    }
  }
);

const PORT = process.env.PORT || 5000;

//start server
const server = app.listen(PORT, () => {
  console.log(`Server started on port localhost:${PORT}`);
});
