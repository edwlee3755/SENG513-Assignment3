var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var initialNameCounter = 1;
var chatLog = [];
var userNameList = [];			//format will be (userName, msgColor, userName, msgColor)

http.listen(port, function(){
  console.log('listening on port: ' ,port);
});

app.use(express.static(__dirname + '/public'));

io.on('connection',function(socket){
	console.log('a user connected');
	
	socket.on('adduser', function(){	

		socket.nickname = "user" + initialNameCounter;	//assign user#(number) as nickname upon user connection
		userNameList.push(socket.nickname); //add this "user#" nickname to username list
		var initialColor = "000000";		// set variable for intial text color of user messages (black)
		userNameList.push(initialColor);	// add corresponding user's message color in index+1 (user1, color, user2, color)
		initialNameCounter++;		//increment the # counter (ex. user1, user2, etc)
		socket.emit('userNameTitle', "Your name is: " + socket.nickname);	//update user title
		socket.emit('informational message', "Your name is: " + socket.nickname);	//send to the user socket that connected his initial name
		
		//display chat history
		socket.emit('informational message', "------ Now Displaying Chat Log: ------");
		for (i = 0; i < chatLog.length; i++)		//iterate through chat log history to send to connected socket the messages contained within the chatlog array
		{											
			socket.emit('chat history', chatLog[i]);	//each index in chatlog array = 1 message
		}
		socket.emit('informational message', "------ End of Chat Log ------");
	});
	
	
	socket.on('update userlist', function(){		//upon connection, when server receives 'update userlist'

		io.emit('onlineUserList', userNameList);	//send the online user list to client so they can update
		
	});
	
	
	
	socket.on('disconnect', function(){			//upon user disconnect
		for (i = 0; i < userNameList.length; i += 2)
		{
			if (socket.nickname === userNameList[i]) //find the user nickname that wishes to disconnect
			{
				userNameList.splice(i, 2); // at index i, remove 2 elements (nickname + corresponding color)
			}
		}
		
		io.emit('onlineUserList', userNameList);   // when a user disconnects, send the username list to all clients so they can update
		console.log('user disconnected');
	});


	//messages section
	
	//send message to everyone, including sender
	socket.on('chat message', function(msg){
		
		var minutes = new Date().getMinutes();
		var hours = new Date().getHours();
		
		if (hours < 10)
		{
			hours = "0" + hours; //format pad 0 if < 10. Ex) 09:08
		}
		if (minutes < 10)
		{
			minutes = "0" + minutes;
		}

		//if the user's message was the command to change nickname
		if (msg.startsWith("/nick "))
		{
			var nickNameRequest;
			var invalidName = false;
			nickNameRequest = msg.substring(6); //take the name substring (parsed out command)
			for (i = 0; i < userNameList.length; i += 2) //check if name request already exists in userNameList
			{
			
				if (nickNameRequest === userNameList[i]) // if it exists, then refuse request
				{
					socket.emit('informational message', "Nick Name already exists, please enter a unique name")
					invalidName = true; //set flag to true so that we do not grant request
				}
				
			}
			if (invalidName == false) //if name was valid
			{
				for (j = 0; j < userNameList.length; j += 2) //iterate loop to find when socket user matches username list
				{
					if (socket.nickname === userNameList[j]) //ex user2 === user2 in the list
					{
						socket.nickname = nickNameRequest;	//set socket nickname to new name request
						userNameList[j] = socket.nickname; // set username list at matching index to socket nickname (new name)
					}
				}

				socket.emit('userNameTitle', "Your name is: " + socket.nickname);	//update the username title when user receives new name
				socket.emit('informational message', "Your name is now: " + socket.nickname);	//tell the user their new name
				io.emit('onlineUserList', userNameList);	//send the online user list to all clients so they can update after changing name
			}
		}
		
		
		// else if user entered command to change nickname color
		else if (msg.startsWith("/nickcolor "))
		{
			var msgColorRequest;
			msgColorRequest = msg.substring(11); //parse out the color request in the remaining substring after the command
			for (i = 0; i < userNameList.length; i += 2)	//find the user in our usernameList since we know index+1 is the corresponding color
			{
				if (socket.nickname === userNameList[i]) //once we find user who wants to change color in our list
				{
					userNameList[i+1] = msgColorRequest; //change the user's corresponding color to request
				}
			}
			socket.emit('chat message', "<i> Your </i>", "<b><i>Name Color </i></b>", "<i>has been changed.</i>", msgColorRequest); //italic string tag will be converted to html italic format in client side
		}
		
		
		//if user did not enter command to change nickname / color, store message in chat history and send message to everyone as normal
		else
		{
			//store into chat log array
			if(chatLog.length == 250)		//maximum chat messages we want to save in log
			{
				chatLog.shift();		// if there is already maximum stored messages, delete oldest one
				chatLog.push(hours + ":" + minutes + " " + socket.nickname + ": " + msg); //add newest message
			}
			else
			{
				chatLog.push(hours + ":" + minutes + " " + socket.nickname + ": " + msg); //if not at maximum stored, just save to log
			}
			console.log('chat message sent at:', hours + ":" + minutes + " // " + msg); //display message on console
			
			var correspondingColor;
			for (i = 0; i < userNameList.length; i += 2)	//find the users corresponding color so we can send over to client to use when formatting html
			{
				if (socket.nickname === userNameList[i])	
				{
					correspondingColor = userNameList[i+1];
				}
			}
			//split message into (part1, name, part2, color) so we can color the parameter with the name, seperate from the message (we onyl want name to be colored, not the message)
			socket.broadcast.emit('chat message', hours + ":" + minutes + " ", socket.nickname, ": " + msg, correspondingColor); // broadcast message to everyone but sender in regular text
			socket.emit('bold message', hours + ":" + minutes + " ", socket.nickname, ": " + msg, correspondingColor); //only send to sender so we can use identifier to bold the text
		}
	});
	
});  //end of io.on()




