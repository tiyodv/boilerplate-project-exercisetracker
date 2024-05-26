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
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
})

// mongoose model
let Session = mongoose.model('Session', exerciseSessionSchema)
let User = mongoose.model('User', userSchema)

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
    date: req.body.date
  })

  // if Date field is empty, add todays date
  if(newSession.date === ''){
    newSession.date = new Date().toISOString().substring(0,10)
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
    responseObject['date'] = new Date(newSession.date).toDateString()
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
    const findByIdUser = await User.findById(req.params._id)
    if(req.query.from || req.query.to){
      const fromDate = new Date()
      const toDate = new Date()
      if(req.query.from){
        fromDate = new Date(req.query.from)
      }
      if(req.query.to){
        toDate = new Date(req.query.to)
      }

      fromDate = fromDate.getTime()
      toDate = toDate.getTime()

      result.log = result.log.filter(session=>{
        const sessionDate = new Date(session.date).getTime()
        return sessionDate >= fromDate && sessionDate <= toDate
      })
    }

    if(req.query.limit){
      result.log = result.log.slice(0, req.query.limit)
    }

    result = result.toJSON()
    result['count'] = result.log.length
    res.json(result)
  } catch (err){
    res.json({"error": err})
  }
})