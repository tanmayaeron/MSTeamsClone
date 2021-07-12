const createLink = document.getElementById('shownew')
const enterLink = document.getElementById('showenter')
const createDiv = document.getElementById('create-room')
const enterDiv = document.getElementById('enter-room')

createLink.addEventListener('click',()=>{
    enterDiv.style.display = "none"
    createDiv.style.display = "block"
})

enterLink.addEventListener('click',()=>{
    createDiv.style.display = "none"
    enterDiv.style.display = "block"  
})