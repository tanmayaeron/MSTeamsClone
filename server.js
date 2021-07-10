const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const db = 'mongodb+srv://tanmayaaeron:tanmay@cluster0.equ8u.mongodb.net/teamsclone?retryWrites=true&w=majority'

mongoose.connect(db,{
  useNewUrlParser : true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(()=>{
  console.log('database connected')
}).catch((err)=>{
  console.log(err,'connection to database failed')
})

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required:true
  },
  rooms: {
    type: Array
  }
})
const User = mongoose.model('user',userSchema)

const roomSchema = new mongoose.Schema({
  roomId: String,
  roomName: String,
  users: Array,
  msgs: Array 
})
const Room = mongoose.model('room',roomSchema)

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/chat',(req,res)=>{
  res.render('chat')
})

app.get('/home',(req,res)=>{
  res.render('home')
})

app.post('/home',(req,res) =>{
  console.log(req.body)
  User.findOne({
    email:req.body.email
  }).then(userExist=>{
    if(userExist){
      // already exists in database
      
      //rendering chat and sending user infromation
      res.render('chat',userExist)
    } else {
      const newUser = new User({
        name: req.body.username,
        email: req.body.email,
        rooms: []
      })

      newUser.save().then(()=>{
        res.status(201).json({message: "user added to database successfully"})
      }).catch(err=>{
        res.status(500).json({error:"user couldn't be added to database"})
      })
    }
  }).catch(err=>{
      console.log("error",err)
  })
})


app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('create-room'),(roomName,name,email)=>{
    const roomId = null
    const roomDetils = null
    do {
      roomId = uuidV4()
      roomDetails = Room.find({roomId})
    } while(roomDetails)

    const newRoom = new Room({
      roomId:roomId,
      rommName:roomName,
      users: [{name:name,email:email}],
      msgs:[]
    })

    newRoom.save().then(()=>{
      socket.emit('room-created',roomId)
    }).catch(err=>{
      res.status(500).json({error:"room couldn't be created"})
    })
  }

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(3000)