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


app.post('/chat',(req,res)=>{
  console.log(req.body)
  if(req.body.type=="enter"){
    if(validator.isUUID(req.body.roomId)==true) {
      
      var msgs = null
      Room.findOne({
        roomID:req.body.roomId
      }).then(roomExist=>{
        if(roomExist) {
          // room already exists in database
          //update room data
          console.log('msgs already',roomExist.msgs)
          msgs = roomExist.msgs

          res.render('chat',{
            roomId:req.body.roomId,
            username:req.body.user,
            msgs:msgs
          })

        } else {
          const newRoom = new Room({
            roomID: req.body.roomId,
            msgs : []
          })
    
          newRoom.save().then(()=>{
            console.log('room created successfully')
          }).catch(err=>{
            console.log('room could not be created')
          })
          msgs = []

          res.render('chat',{
            roomId:req.body.roomId,
            username:req.body.user,
            msgs:msgs
          })

        }
      }).catch(err=>{
          console.log("error",err)
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

app.post('/video-call', (req, res) => {
  //roomId userName

  var msgs = null 

  Room.findOne({
    roomID:req.body.roomId
  }).then(roomExist=>{
    if(roomExist) {
      // room already exists in database
      //update room data
      msgs = roomExist.msgs

      res.render('room',{
        roomId:req.body.roomId,
        userName:req.body.userName,
        msgs:msgs
      })

    } else {
      console.log('old chats of this room not found')
      res.render('room',{
        roomId:req.body.roomId,
        userName:req.body.userName,
        msgs:[]
      })
    }
  }).catch(err=>{
      console.log("error",err)
  })
})

app.post('/exit',(req,res)=>{
  console.log(req.body)
  res.render('exit',{
    roomId:req.body.roomId,
    userName:req.body.userName
  })
})

var chatUsers = {}
io.on('connection', socket => {

  socket.on('join-chat-room',(roomId,userName)=>{
    if(chatUsers[roomId]) {
      chatUsers[roomId][socket.id] = userName
    } else {
      chatUsers[roomId] = {}
      chatUsers[roomId][socket.id] = userName
    }
    socket.join(roomId)

    socket.broadcast.to(roomId).emit('user-joined',socket.id,userName)
    socket.emit('recieve-users',chatUsers[roomId])

    socket.on('send-msg',data=>{

      //update in database
      Room.updateOne({
        roomID:roomId
      },{
        $push:{msgs:data} 
      },{
        upsert:true
      },(err,res)=>{
        if (err) throw err
        console.log("document updated")
      })

      io.in(roomId).emit('recieve-msg',data)
    })

    socket.on('disconnect',()=>{
      const userId = socket.id
      if(chatUsers[roomId]&&chatUsers[roomId][userId]) delete chatUsers[roomId][userId]
      socket.broadcast.to(roomId).emit('user-left',userId)
    })
  })

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
          updateMsg.push(data)
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

server.listen(process.env.PORT||3000)