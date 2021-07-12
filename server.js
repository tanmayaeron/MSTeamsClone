const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const validator = require('validator')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4: uuidV4 } = require('uuid')

const db = 'mongodb+srv://tanmayaaeron:tanmay@cluster0.equ8u.mongodb.net/teamsclone?retryWrites=true'

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

const roomSchema = new mongoose.Schema({
  roomID: {
    type: String,
    required: true
  },
  msgs : Array
})

const Room = mongoose.model('room',roomSchema)

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
  res.render('home')
})

//app.get('/chat',(req,res)=>{
//  res.render('chat')
//})

app.post('/chat',(req,res)=>{
  console.log(req.body)
  if(req.body.type=="enter"){
    if(validator.isUUID(req.body.roomId)==true) {
      
      const msgs = null
      Room.findOne({
        roomID:req.body.roomId
      }).then(roomExist=>{
        if(roomExist) {
          // room already exists in database
          //update room data
          msgs = roomExist.msgs
        } else {

          const newRoom = new Room({
            roomID: roomId,
            msgs : []
          })
    
          newRoom.save().then(()=>{
            console.log('room created successfully')
          }).catch(err=>{
            console.log('room could not be created')
          })
          msgs = []
        }
      }).catch(err=>{
          console.log("error",err)
      })

      res.render('chat',{
        roomId:req.body.roomId,
        name:req.body.user,
        msgs:msgs
      })

    } else {
      res.redirect('/')
    }

  } else if(req.body.type=="new"){
    
    try {
      const roomId = uuidV4()
      const newRoom = new Room({
          roomID: roomId,
          msgs: []
      })

      
      newRoom.save().then(()=>{
        console.log('room created successfully')
      }).catch(err=>{
        console.log('room could not be created')
      })

      console.log(roomId)
      res.render('chat', {
          roomId: roomId,
          username: req.body.user,
          msgs:[]
      })

    } catch (error) {
      res.status(400).send(error);
    }

  }
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    socket.on('send-msg',data=>{
      //finding room data
      Room.findOne({
        roomID:roomId
      }).then(roomExist=>{
        if(roomExist){
          // room already exists in database
          
          //update room data
          const updateMsg = roomExist.msgs
          console.log(updateMsg)
          updateMsg.push(data)
          console.log(updateMsg)
          Room.updateOne({roomID:roomId},{$set:{msgs:updateMsg}}, (err,res)=>{
            if (err) throw err
            console.log("document updated")
          })
        } else {
          const newRoom = new Room({
            roomID: roomId,
            msgs : [data]
          })
    
          newRoom.save().then(()=>{
            console.log('room created successfully')
          }).catch(err=>{
            console.log('room could not be created')
          })
        }
      }).catch(err=>{
          console.log("error",err)
      })

      socket.broadcast.to(roomId).emit('recieve-msg',data)
    })

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(3000)