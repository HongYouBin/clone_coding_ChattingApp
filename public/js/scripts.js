const socket = io('/chattings');
const getElementById = (id) => document.getElementById(id) || null;
const helloStragerElement = getElementById('hello_stranger');
const chattingBoxElement = getElementById('chatting_box');
const formElement = getElementById('chat_form');

// ---------- global socket handler ----------
socket.on('user_connected', (username) => {
  drawNewChat(`${username} connected`);
});

socket.on('new_chat', (data) => {
  const { chat, username } = data;
  drawNewChat(`${username}: ${chat}`);
});

socket.on('disconnect_user', (username) => drawNewChat(`${username}: bye...`));

//---------- 화면에다 그리는 fucntion ----------
const drawHelloStranger = (username) => {
  helloStragerElement.innerText = `Hello ${username} Stranger :)`;
};

const drawNewChat = (message) => {
  const wrapperChatBox = document.createElement('div');
  const chatBox = `
  <div>
    ${message}
  </div>
  `;
  wrapperChatBox.innerHTML = chatBox;
  chattingBoxElement.append(wrapperChatBox);
};

// ---------- event callback functions ----------
const handlerSubmit = (event) => {
  event.preventDefault();
  const inputValue = event.target.elements[0].value;
  if (inputValue !== ' ') {
    socket.emit('submit_chat', inputValue);
    //화면에다가 그리기
    drawNewChat(`me : ${inputValue}`);
    event.target.elements[0].value = ' ';
  }
};

// ----------------------------------------------
function helloUser() {
  const username = prompt('what is your name?');
  socket.emit('new_user', username, (data) => {
    // console.log(data);
    drawHelloStranger(data);
  });
}

function init() {
  helloUser();
  formElement.addEventListener('submit', handlerSubmit);
}

init();
