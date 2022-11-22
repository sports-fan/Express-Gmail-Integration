const express = require('express')
const multer = require("multer")
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { google } = require("googleapis")
const nodemailer = require("nodemailer")
require('dotenv').config()

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static("public"))

const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./attachments");
  },
  filename: function (req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
})

const attachmentUpload = multer({
  storage: Storage,
}).single("attachment")

// require('./app/routes/app.routes.js')(app);

const connectionString = "mongodb://localhost:27017/sampleDB"
mongoose.Promise = global.Promise
mongoose.connect(connectionString, {
  useNewUrlParser: true
}).then(() => {
  console.log("Successfully connected to the database");    
}).catch(err => {
  console.log('Could not connect to the database. Error...', err);
  process.exit();
})

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
  })

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token :( " + err);
      }
      resolve(token);
    })
  })

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.SENDER_EMAIL,
      accessToken,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
    tls: {rejectUnauthorized: false}
  })

  return transporter;
}

app.get('/', (req, res) => {
  res.sendFile("/index.html")
  res.json({ "message": "Server is running :D"})
})

app.post("/send_email", attachmentUpload, async (req, res) => {
  const file = req.file
  if (!file) {
    console.log(err);
    return res.send("Error uploading file");
  } else {
    const recipient = req.body.email;
    const mailSubject = req.body.subject;
    const mailBody = req.body.message;
    const attachmentPath = file?.path;
    
    let mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: recipient,
      subject: mailSubject,
      text: mailBody,
      attachments: [
        {
          path: attachmentPath,
        },
      ],
    }
    
    try {
      // Get response from the createTransport
      let emailTransporter = await createTransporter();
      // Send email
      emailTransporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          // failed block
          console.log(error);
        } else {
          // Success block
          console.log("Email sent: " + info.response);
          return res.redirect("/success.html");
        }
      });
    } catch (error) {
      return console.log(error);
    }
  }
});

let port = 8000

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
