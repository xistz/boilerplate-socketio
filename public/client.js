$(document).ready(function () {
  /*global io*/
  const socket = io();

  socket.on('user', function (data) {
    console.log(data);
    $('#num-users').text(data.currentUsers + ' users online');
    var message = data.name;
    if (data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  socket.on('chat message', (data) => {
    const { name, chatMessage } = data;
    const message = `${name}: ${chatMessage}`;

    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    //send message to server here?
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});
