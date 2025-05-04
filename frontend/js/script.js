// login elements
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }

let websocket

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")

    div.classList.add("message--self")
    div.innerHTML = content

    return div
}

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")

    span.classList.add("message--sender")
    span.style.color = senderColor

    div.appendChild(span)

    span.innerHTML = sender
    div.innerHTML += content

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data)

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor)

    chatMessages.appendChild(message)

    scrollScreen()
}

const handleLogin = (event) => {
    event.preventDefault()

    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    websocket = new WebSocket("wss://chat-fa-furioso.onrender.com")
    websocket.onmessage = processMessage
}

const sendMessage = (event) => {
    event.preventDefault()

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value
    }

    websocket.send(JSON.stringify(message))

    chatInput.value = ""
}

const videoButton = document.querySelector(".chat__video-button")
const videoPreview = document.querySelector(".chat__video-preview")
const sendVideoButton = document.querySelector(".chat__send-video-button")
const cancelVideoButton = document.querySelector(".chat__cancel-video-button")

let mediaRecorder
let recordedChunks = []

videoButton.addEventListener("click", async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    videoPreview.srcObject = stream
    recordedChunks = []

    mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data)
        }
    }

    mediaRecorder.onstart = () => {
        videoPreview.style.display = "block"
        sendVideoButton.style.display = "block"
        cancelVideoButton.style.display = "block"
    }

    mediaRecorder.start()
})


cancelVideoButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop()
    }

    if (videoPreview.srcObject) {
        videoPreview.srcObject.getTracks().forEach(track => track.stop())
    }

    videoPreview.style.display = "none"
    sendVideoButton.style.display = "none"
    cancelVideoButton.style.display = "none"
    videoPreview.srcObject = null
    recordedChunks = []
})

sendVideoButton.addEventListener("click", () => {
    mediaRecorder.stop()

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" })
        const url = URL.createObjectURL(blob)

        const videoMessage = `<video controls width="250"><source src="${url}" type="video/webm"></video>`

        const message = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: videoMessage
        }

        websocket.send(JSON.stringify(message))

        // Reset UI
        videoPreview.style.display = "none"
        sendVideoButton.style.display = "none"
        cancelVideoButton.style.display = "none"

        if (videoPreview.srcObject) {
        videoPreview.srcObject.getTracks().forEach(track => track.stop())
        videoPreview.srcObject = null
    }
    }
})

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)