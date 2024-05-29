const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose') // mongoose requier
const { response } = require('express')
require('dotenv').config()

// mongoose connet
main( ).catch(err => console.log(err))

async function main ( ){
	await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded())
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// mongoose shcema
let exerciseSessionSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: Number,
  _id: false
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
})

// mongoose model
let Session = mongoose.model('Session', exerciseSessionSchema)
let User = mongoose.model('User', userSchema)

// date formater
function dateFormatter(date){
    const targetDate = new Date(date)
    const formatterDate  = targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    const newFormatterDate = formatterDate
    const newNewFormatterDate = newFormatterDate.replace(/,/g, "")
    return newNewFormatterDate
}

// create new user
app.post('/api/users', async function(request, response) {
  let newUser = new User({
      username: request.body.username					
    });
  try {
  const addedUser = await newUser.save()
  let responseObject = {}
  responseObject['username'] = addedUser.username
  responseObject['_id'] = addedUser.id
  response.json(responseObject)	
  } catch (err){
    console.error(err)
  }
})

// get all user
app.get('/api/users/', async(req, res)=>{
  try{
    const findUsers = await User.find({})
      res.json(findUsers)
    } catch (err) {
      console.error(err)
    }
  });

// create exercise
app.post('/api/users/:_id/exercises', async(req, res)=>{
  // add new exercise
  const newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: Date.parse(req.body.date)
  })

  // if Date field is empty, add todays date
  if(newSession.date === ''){
    newSession.date = Date.now()
  }

  // Get Id from index.html
  try{
    const findByIdAndUpdateUser = await User.findByIdAndUpdate(
      req.params._id,
      {$push : {log: newSession}},
      {new: true},
    )
  
    let responseObject = {}
    responseObject['_id'] = findByIdAndUpdateUser.id
    responseObject['username'] = findByIdAndUpdateUser.username
    responseObject['date'] = dateFormatter(newSession.date)
    responseObject['description'] = newSession.description
    responseObject['duration'] = newSession.duration
    res.json(responseObject)
    } catch (err){
      res.json({"error": err})
    }
})

// get Logs user
app.get('/api/users/:id/logs', async(req, res)=>{
  try{
    const findByIdUser = await User.findById(req.params.id)
    if(req.query.from || req.query.to){
      let fromDate = 1
      let toDate = Number.MAX_SAFE_INTEGER
      if(req.query.from){
        fromDate = Date.parse(req.query.from)
      }
      if(req.query.to){
        toDate = Date.parse(req.query.to)
      }
      findByIdUser.log = findByIdUser.log.filter((session) => (session.date >= fromDate && session.date <= toDate))
    }

    if(req.query.limit){
      findByIdUser.log = findByIdUser.log.slice(0, req.query.limit)
    }

    function generateResponse(data){
      const formattedData = {
        _id: data._id,
        username: data.username,
        count: data.log.length,
        log: data.log.map((logEntry) => ({
          description: logEntry.description,
          duration: logEntry.duration,
          date: new Date(logEntry.date).toDateString()
        }))
      }
      return formattedData
    }

    const responseJson = generateResponse(findByIdUser)

    res.json(responseJson)
  } catch (err){
    res.json({"error": err})
  }
})