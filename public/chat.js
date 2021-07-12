const socket = io()

const users = {}

const usersList = document.querySelector(".users-list")
const chatForm = document.getElementById("msg-form")
const msgDisplay = document.querySelector(".msgs")

socket.emit('join-chat-room',roomId,userName)

socket.on('user-joined',(userId,userName)=>{
   const user = document.createElement("div")
   user.className = "user"
   user.innerHTML = userName
   usersList.append(user)
   users[userId] = {userName,user} 
})

socket.on('recieve-users',person=>{
    var keys = Object.keys(person)
    keys.forEach((item)=>{
        const userElement = document.createElement("div")
        userElement.className = "user"
        userElement.innerHTML = person[item]
        usersList.append(userElement)
        users[item] = {userName:person[item],user:userElement}
    })
})

chatForm.addEventListener('submit', e => {
    e.preventDefault();
  
    //get message text
    const msg = e.target.elements.msg.value;
    //emit message to server
    socket.emit('send-msg', {userName,msg});
    //clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
})

socket.on('recieve-msg',data=>{
    const msgBlock = document.createElement("div")
    msgBlock.className = "single-msg"
    const name = document.createElement("div")  
    name.className = "name"
    name.innerHTML = data.userName
    const msgContent = document.createElement("div")
    msgContent.className = "text"
    msgContent.innerHTML = data.msg
    msgBlock.append(name)
    msgBlock.append(msgContent)
    msgDisplay.append(msgBlock)
})

socket.on('user-left',userId=>{
    if(users[userId]){
        users[userId]["user"].remove()
        delete users[userId]["user"]
    }
})