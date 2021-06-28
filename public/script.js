const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const timeDisplay = document.querySelector('.control-left')

const myPeer = new Peer()
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

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
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
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
