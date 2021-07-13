const socket = io('/')


const videoGrid = document.getElementById('video-grid')
const timeDisplay = document.querySelector('.control-left')
const mic = document.getElementById('mic')
const video = document.getElementById('video')
const caption = document.getElementById('caption')
const screenShare = document.getElementById('screenshare')
const endCall = document.getElementById('call_end')
const peopleButton = document.getElementById('people_btn')
const msgButton = document.getElementById('msg_btn')
const peopleBlock = document.getElementById('people-block')
const msgBlock = document.getElementById('msg-block')
const people = document.getElementById('participants')
const msgGroup  = document.getElementById('msgs')
const chatForm = document.getElementById('chat-form')


let peopleDisplay = false
let msgDisplay = false

const myNameDisplay = document.createElement("div")
myNameDisplay.innerHTML = myName
people.append(myNameDisplay)

let myId;
const myPeer = new Peer()
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
const users = {}

let myVideoStream;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream
  addVideoStream(myVideo, stream)

  myPeer.on('connection', conn=>{

    conn.on('open', function() {

      const nameDisplay = document.createElement("div")

      // Receive data
      conn.on('data', function(data) {
        users[data.userId] = {userName:data.userName,connection:conn}
        nameDisplay.innerHTML = data.userName
        people.append(nameDisplay)
      })

      //send data
      conn.on('close',()=>{
        nameDisplay.remove()
      })

      conn.send({userId:myId,userName:myName})
    })

  })
  
  myPeer.on('call', call => {
    call.answer(stream)
    peers[call.peer] = call
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })

  socket.on('recieve-msg',data =>{
    addMessage(data)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].close()
    delete peers[userId]
  }
  if(users[userId]) {
    users[userId].connection.close()
    delete users[userId]
  }
})

myPeer.on('open', id => {
  myId = id
  socket.emit('join-room', ROOM_ID, id)
})

mic.addEventListener('click',()=>{
  let enabled = myVideoStream.getAudioTracks()[0].enabled
  if(enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false
    setUnmuteButton()
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true
    setmuteButton()
  }
})

video.addEventListener('click',()=>{
  let enabled = myVideoStream.getVideoTracks()[0].enabled
  if(enabled){
    myVideoStream.getVideoTracks()[0].enabled = false
    setPlayVideo()
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true
    setStopVideo()
  }
})


peopleButton.addEventListener('click',()=>{
  msgBlock.style.display = 'none'
  if(peopleDisplay==false){
    peopleBlock.style.display = 'flex'
    peopleDisplay = true
    msgDisplay = false
  } else {
    peopleBlock.style.display = 'none'
    peopleDisplay = false
  }
})

msgButton.addEventListener('click',()=>{
  peopleBlock.style.display = 'none'
  if(msgDisplay==false){
    msgBlock.style.display = 'flex'
    msgDisplay = true
    peopleDisplay = false
  } else {
    msgBlock.style.display = 'none'
    msgDisplay = false
   }
})

//message part
// // input value
// let text = $("input")
// // // when press enter send message
// $('html').keydown(function(e) {
//     if (e.which == 13 && text.val().length !== 0) {
//       // const msg = document.createElement("div")
//       // msg.classList = "msg"
//       // const name = document.createElement("div")
//       // name.classList = "name"
//       // name.innerHTML = "You"
//       // const msgText = document.createElement("div")
//       // msgText.classList = "text"
//       // msgText.innerHTML = text
//       // msg.append(name)
//       // msg.append(msgText)
//       // msgGroup.append(msg)
//       socket.emit('send-msg',{userName:myName,msg:text})
//       text.val('')
//     }
// });

// sendMsg.addEventListener('click',()=>{
//   const text = msgInput.nodeValue
//   if(text){
//     const msg = document.createElement("div")
//     msg.classList = "msg"
//     const name = document.createElement("div")
//     name.classList = "name"
//     name.innerHTML = "You"
//     const msgText = document.createElement("div")
//     msgText.classList = "text"
//     msgText.innerHTML = text
//     msg.append(name)
//     msg.append(msgText)
//     socket.emit('send-msg',{userName:myName,msg:text})
//   }
// })

chatForm.addEventListener('submit', e => {
  e.preventDefault();

  //get message text
  const msg = e.target.elements.msg.value;
  const msgB = document.createElement("div")
  msgB.classList = "msg"
  const name = document.createElement("div")
  name.classList = "name"
  name.innerHTML = myName
  const msgText = document.createElement("div")
  msgText.classList = "text"
  msgText.innerHTML = msg
  msgB.append(name)
  msgB.append(msgText)
  msgGroup.append(msgB)
  //emit message to server
  socket.emit('send-msg', {userName:myName,msg});

  //clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
})

function connectToNewUser(userId, stream) {
  const conn = myPeer.connect(userId)

  conn.on('open', function() {
    
    const nameDisplay = document.createElement("div")
    //recive data
    conn.on('data', function(data) {
      users[data.userId] = {userName:data.userName,connection:conn}
      nameDisplay.innerHTML = data.userName
      people.append(nameDisplay)
    })

    conn.on('close',()=>{
      nameDisplay.remove()
    })

    //send data
    conn.send({userId:myId,userName:myName})
  })
  
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addMessage(data) {
  const msg = document.createElement("div")
  msg.classList = "msg"
  const name = document.createElement("div")
  name.classList = "name"
  name.innerHTML = data.userName
  const msgText = document.createElement("div")
  msgText.classList = "text"
  msgText.innerHTML = data.msg
  msg.append(name)
  msg.append(msgText)
  msgGroup.append(msg)
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

function showTime(){
  var date = new Date()
  var h = date.getHours()
  var m = date.getMinutes() 
  var s = date.getSeconds()
  var session = "AM";
    
  if(h == 0){
      h = 12;
  }
    
  if(h > 12){
      h = h - 12;
      session = "PM"
  }
    
  h = (h < 10) ? "0" + h : h
  m = (m < 10) ? "0" + m : m
    
  var time = h + ":" + m + " " + session
  timeDisplay.innerHTML = time
  setTimeout(showTime,1000)
}

showTime()

function setUnmuteButton() {
  const html = `<i class="material-icons">mic_off</i>`
  mic.style.backgroundColor = "red"
  mic.innerHTML = html
}

function setmuteButton() {
  const html = `<i class="material-icons">mic</i>`
  mic.style.backgroundColor = "#4e545a"
  mic.innerHTML = html
}

function setPlayVideo() {
  const html = `<i class="material-icons">videocam_off</i>`
  video.style.backgroundColor = "red"
  video.innerHTML = html
}

function setStopVideo() {
  const html = `<i class="material-icons">videocam</i>`
  video.style.backgroundColor = "#4e545a"
  video.innerHTML = html
}