document.addEventListener('DOMContentLoaded', () => {

	// connect to websocket
	var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
	socket.on('connect', () => {
		// check if user entered a display name before
		if (localStorage.getItem('user')) {
			const user = localStorage.getItem('user');

			// hide display name form
			$('#modal-form').modal('hide');

			// update user's display name in side-bar
			document.querySelector('#user').innerHTML = user;

			// check if user joined a channel before
			if (localStorage.getItem('channel')) {
				const channel = localStorage.getItem('channel');

				// redirect to last joined channel
				socket.emit('join channel', {'channel': channel, 'user': user});
			}
			else {
				// set default channel-name
				document.querySelector('#channel-name').innerHTML = 'To chat, join a channel!';
			};
		}
		else {
			// show display name form
			$('#modal-form').modal({
				show: true,
				backdrop: 'static', // do not close when backdrop is clicked
				keyboard: false // do not close when esc is pressed
			});

		    // focus on modal-input
		    focusInput('#modal-input', 500);
		};
	});


	// enable modal-button when user types something into modal-input
	configButton('#modal-input', '#modal-button');


	// emit new user event when user clicks modal-button
	document.querySelector('#modal-button').onclick = () => {
		const user = document.querySelector('#modal-input').value;
		socket.emit('new user', {'user': user});
	};


	// when user entered a display name that is already taken
	socket.on('decline user', (data) => {
		// clear display name entered, refocus on modal-input, disable modal-button again
		document.querySelector('#modal-input').value = '';
		focusInput('#modal-input', 0);
		document.querySelector('#modal-button').disabled = true;

		// show error message
		document.querySelector('#modal-error').innerHTML = data.error;
	});


	// when user entered a display name that is not taken
	socket.on('accept user', (data) => {
		// hide display name form
		$('#modal-form').modal('hide');

		// add user to local storage, update display name in user-sidebar, set default channel-name
		localStorage.setItem('user', data.user);
		document.querySelector('#user').innerHTML = data.user;
		document.querySelector('#channel-name').innerHTML = 'To chat, join a channel!';
	});


	// enable channel-button when user types something into channel-input
	configButton('#channel-input', '#channel-button');


	// emit new channel event when user clicks channel-button
	document.querySelector('#channel-button').onclick = () => {
		const channel = document.querySelector('#channel-input').value;
		socket.emit('new channel', {'channel': channel});
	};


	// when user entered a channel name that already exists
	socket.on('decline channel', (data) => {
		// clear channel name entered, refocus on channel-input, disable channel-button again
		document.querySelector('#channel-input').value = '';
		focusInput('#channel-input', 0);
		document.querySelector('#channel-button').disabled = true;

		// show error message
		document.querySelector('#channel-error').innerHTML = data.error;
	});


	// when user entered a channel name that does not exist
	socket.on('accept channel', (data) => {
		// clear channel-input and error message
		document.querySelector('#channel-input').value = '';
		document.querySelector('#channel-error').innerHTML = '';

		// create li to store new channel, add channel to channel-sidebar, scroll to bottom of channel-list
		const li = document.createElement('li');
		li.innerHTML = data.channel;
		li.setAttribute('class', 'list-group-item');
		li.setAttribute('data-channel', data.channel);
		document.querySelector('#channel-list').append(li);
		scrollBottom('#channel-list');
	});


	// attach click event to channel-list
	document.querySelector('#channel-list').addEventListener('click', (e) => {
		const curr_channel = localStorage.getItem('channel');
		const next_channel = e.target.dataset.channel;
		const user = localStorage.getItem('user');

		// check if channel clicked is different from current channel
		if (curr_channel!==next_channel) {
			// emit leave channel event if current channel exists
			if (curr_channel) {
				socket.emit('leave channel', {'channel': curr_channel, 'user': user});
			};

			// update local storage, clear view-messages, emit join channel event
			localStorage.setItem('channel', next_channel);
			document.querySelector('#messages-view').innerHTML = '';
			socket.emit('join channel', {'channel': next_channel, 'user': user});
		};
	});


	// when message history of a channel needs to be loaded
	socket.on('load messages', (data) => {
		for (let i=0; i<data.length; i++) {
			// create div to store message
			const msg = document.createElement('div');

			// check if message is string or file
			if (typeof data[i].message == 'string') {
				msg.innerHTML = '<span class="msg-user">'+data[i].user+':'+'</span>'+
								'<span class="msg-content">'+data[i].message+'</span>'+
								'<span class="msg-time">'+data[i].timestamp+'</span>';
			}
			else {
				// create download link for file
				const file_link = window.URL.createObjectURL(new Blob([data[i].message['file_array']]));

				// create hyperlink to store file link
				const a = document.createElement('a');
				a.setAttribute('href', file_link);
				a.setAttribute('download', data[i].message['file_name']);
				a.innerHTML = 'download';

				msg.innerHTML = '<span class="msg-user">'+data[i].user+':'+'</span>'+
								'<span class="msg-content">'+'"'+data[i].message['file_name']+'"'+'</span>';
				msg.appendChild(a);
				const span = document.createElement('span');
				span.setAttribute('class', 'msg-time');
				span.innerHTML = data[i].timestamp;
				msg.appendChild(span);
			};
			
			// check if message was sent by local user
			if (data[i].user==localStorage.getItem('user')) {
				msg.setAttribute('class', 'msg-by-me');
			}
			else {
				msg.setAttribute('class', 'msg-by-others');
			};

			// add message to messages-view
			document.querySelector('#messages-view').append(msg);
		};

		// scroll to bottom of messages-view
		scrollBottom('#messages-view');
	});


	// when user joins a channel
	socket.on('user joined', (data) => {
		// update channel-name
		document.querySelector('#channel-name').innerHTML = '<i class="fa fa-comments"></i>'+data.channel;

		// enable msg-input and msg-file
		document.querySelector('#msg-input').disabled = false;
		document.querySelector('#msg-file').disabled = false;

		// create div to store user joined message, add message to messages-view, scroll to bottom of messages-view
		const div = document.createElement('div');
		div.setAttribute('class', 'msg-to-notify');
		div.innerHTML = data.user + ' joined';
		document.querySelector('#messages-view').append(div);
		scrollBottom('#messages-view');
	});


	// when user leaves a channel
	socket.on('user left', (data) => {
		// create div to store user left message, add message to messages-view, scroll to bottom of messages-view
		const div = document.createElement('div');
		div.setAttribute('class', 'msg-to-notify');
		div.innerHTML = data.user + ' left';
		document.querySelector('#messages-view').append(div);
		scrollBottom('#messages-view');
	});


	// enable msg-button when user types something into msg-input
	configButton('#msg-input', '#msg-button');


	// emit new message event when user clicks msg-button
	document.querySelector('#msg-button').onclick = () => {
		const message = document.querySelector('#msg-input').value;
		const channel = localStorage.getItem('channel');
		const user = localStorage.getItem('user');
		socket.emit('new message', {'message': message, 'channel': channel, 'user': user});

		// clear message entered, disable msg-button again
		document.querySelector('#msg-input').value = '';
		document.querySelector('#msg-button').disabled = true;
	};


	// when a new message is sent to a channel
	socket.on('accept message', (data) => {
		// create div to store message
		const msg = document.createElement('div');
		msg.innerHTML = '<span class="msg-user">'+data.user+':'+'</span>'+
						'<span class="msg-content">'+data.message+'</span>'+
						'<span class="msg-time">'+data.timestamp+'</span>';
		
		// check if message was sent by local user
		if (data.user==localStorage.getItem('user')) {
			msg.setAttribute('class', 'msg-by-me');
		}
		else {
			msg.setAttribute('class', 'msg-by-others');
		};

		// add message to messages-view, scroll to bottom of messages-view
		document.querySelector('#messages-view').append(msg);
		scrollBottom('#messages-view');
	});


	// attach change event to msg-file
	document.querySelector('#msg-file').addEventListener('change', () => {
		// transform file to fixed-length binary buffer
		const file = document.querySelector('#msg-file').files[0];
		const file_reader = new FileReader();
		file_reader.readAsArrayBuffer(file);

		// load file using fileloader
		file_reader.onload = () => {
			const array_buffer = file_reader.result;

			// emit new file event
		    socket.emit('new file', {'user': localStorage.getItem('user'),
							    	'channel': localStorage.getItem('channel'),
							    	'file_array': array_buffer,
							    	'file_name': file.name,
							    	'file_type': file.type,
							    	'file_size': file.size});
		};
	});


	// when a new file is uploaded to a channel
	socket.on('accept file', (data) => {
		// create download link for file
		const file_link = window.URL.createObjectURL(new Blob([data.file_array]));

		// create hyperlink to store file link
		const a = document.createElement('a');
		a.setAttribute('href', file_link);
		a.setAttribute('download', data.file_name);
		a.innerHTML = 'download';

		// create div to store message
		const msg = document.createElement('div');
		msg.innerHTML = '<span class="msg-user">'+data.user+':'+'</span>'+
						'<span class="msg-content">'+'"'+data.file_name+'"'+'</span>';
		msg.appendChild(a);
		const span = document.createElement('span');
		span.setAttribute('class', 'msg-time');
		span.innerHTML = data.timestamp;
		msg.appendChild(span);

		// check if message was sent by local user
		if (data.user==localStorage.getItem('user')) {
			msg.setAttribute('class', 'msg-by-me');
		}
		else {
			msg.setAttribute('class', 'msg-by-others');
		};

		// add message to messages-view, clear msg-file, scroll to bottom of messages-view
		document.querySelector('#messages-view').append(msg);
		document.querySelector('#msg-file').value = '';
		scrollBottom('#messages-view');
	});

 });


function focusInput(input_id, time) {
	// select input without having to click
	setTimeout(function () {
		$(input_id).focus();
	}, time);
}


function configButton(input_id, button_id) {
	// enable button when something is typed into input
	document.querySelector(input_id).onkeyup = () => {
		if (document.querySelector(input_id).value.length>0) {
			document.querySelector(button_id).disabled = false;
		}
		else {
			document.querySelector(button_id).disabled = true;
		};
	};
}


function scrollBottom(id) {
	// scroll to bottom of view automatically
	document.querySelector(id).scrollTop = document.querySelector(id).scrollHeight;
}