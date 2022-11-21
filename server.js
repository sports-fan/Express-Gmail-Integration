const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

require('./app/routes/app.routes.js')(app);

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


app.get('/', (req, res) => {
  res.json({ "message": "Server is running :D"})
})

let port = 8000

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
