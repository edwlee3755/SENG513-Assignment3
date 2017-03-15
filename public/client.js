$(function() {
        
        var socket = io();
		
		$('form').submit(function(){		//causes all messages submitted in the form to be sent with a 'chat message' identifier
			socket.emit('chat message', $('#m').val());
			$('#m').val('');
			return false;
		});
		
		socket.on('connect', function(){ //upon connect call 'add user to server'
			socket.emit('adduser');
			socket.emit('update userlist');
		});	
		
		socket.on('onlineUserList', function(msg){
			$('#userList').empty(); // empty out the current elements in our user list since we receive the newest updated list
			
			var message = "";
			for (i = 0; i < msg.length; i += 2)
			{
				message += "<b>" + msg[i] + "</b>" + "<br/>"		//use break line in between users in our usernamelist passed in
			}
			$('#userList').append($('<li>').html(message));
		});
		
		
		
		socket.on('userNameTitle', function(msg){	//upon receiving 'userNameTitle' identifier, set the text of userNameTitle to passed in msg
			$('#userNameTitle').html(msg);
		});
		
		socket.on('chat message', function(msg1, name, msg2, color){		//upon receiving a chat message identifier from server append to list
			var entireMessage;
			name = name.fontcolor(color);
			entireMessage = msg1 + name + msg2;
			$('#messages').append($('<li>').html(entireMessage));		//append message to message list in html format
			$('#messages').scrollTop($('#messages')[0].scrollHeight);	//keep messages scrolled to the bottom
		});
		
		//receives 4 parameters (msgPart1, name, msgPart2, color) - This is used to differentiate which part is the name to color
		socket.on('bold message', function(msg1, name, msg2, color){	//upon receiving a bold message identifier, bold the message, then append
			var completeMessage;
			name = name.fontcolor(color);
			completeMessage = "<b>" + msg1 + name + msg2 + "</b>";		//this means that it is the user who sent the message that gets their own message bolded
			$('#messages').append($('<li>').html(completeMessage));		//append entireMessage to message list in html format so the string tags wil work
			$('#messages').scrollTop($('#messages')[0].scrollHeight);	//keep messages scrolled to the bottom
		});
		
		
		//need different identifier to differentiate color text from regular messages
		socket.on('informational message', function(msg){			//upon receiving an informational message identifier, bold the message, then append
			msg = "<big>" + "<b>" + msg + "</b>" + "</big>";
			$('#messages').append($('<li>').html(msg));				//append message to message list in html format so the string tags will work
			$('#messages').scrollTop($('#messages')[0].scrollHeight);	//keep messages scrolled to the bottom
		});
		
		socket.on('chat history', function(msg){			
			msg = "<i>" + msg + "</i>";
			$('#messages').append($('<li>').html(msg));				//append message to message list in html format so the string tags will work
			$('#messages').scrollTop($('#messages')[0].scrollHeight);	//keep messages scrolled to the bottom
		});
		
});

