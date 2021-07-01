const socket = io('/')

const myName = prompt("Enter your name")

const videoGrid = document.getElementById('video-grid')
const timeDisplay = document.querySelector('.control-left')
const mic = document.getElementById('mic')
const video = document.getElementById('video')
const caption = document.getElementById('caption')
const screenShare = document.getElementById('screenshare')
const endCall = document.getElementById('call_end')
const people = document.getElementById('participants')

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

      // Receive data
      conn.on('data', function(data) {
        users[data.userId] = data.userName
        const nameDisplay = document.createElement("div")
        nameDisplay.innerHTML = data.userName
        people.append(nameDisplay)
      })

      //send data
      conn.send({userId:myId,userName:myName})
    })

  })
  
  myPeer.on('call', call => {
    call.answer(stream)
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
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
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

function connectToNewUser(userId, stream) {
  const conn = myPeer.connect(userId)

  conn.on('open', function() {
    
    //recive data
    conn.on('data', function(data) {
      users[data.userId] = data.userName
      const nameDisplay = document.createElement("div")
      nameDisplay.innerHTML = data.userName
      people.append(nameDisplay)
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
  mic.style.backgroundColor = "rgb(31, 30, 30)"
  mic.innerHTML = html
}

function setPlayVideo() {
  const html = `<i class="material-icons">videocam_off</i>`
  video.style.backgroundColor = "red"
  video.innerHTML = html
}

function setStopVideo() {
  const html = `<i class="material-icons">videocam</i>`
  video.style.backgroundColor = "rgb(31, 30, 30)"
  video.innerHTML = html
}