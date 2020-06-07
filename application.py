import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

users = []
channels = ['general']
messages = {'general': []} # {'channel': [{'user': message': 'timestamp':}]}
limit = 100


@app.route("/")
def index():
	return render_template('index.html', channels=channels)


@socketio.on('new user')
def new_user(data):
    """register a new user"""
    user = data['user']

    # check if display name already exists
    if user in users:
    	emit('decline user', {'error': 'Display name already taken'})

    else:
    	# add new user to list of existing users
    	users.append(user)
    	emit('accept user', {'user': user})


@socketio.on('new channel')
def new_channel(data):
	"""create a new channel"""
	channel = data['channel']

	# check if channel already exists
	if channel in channels:
		emit('decline channel', {'error': 'Channel already exists'})

	else:
		# add new channel to list of existing channels, create message list for new channel, broadcast new channel to all users
		channels.append(channel)
		messages[channel] = []
		emit('accept channel', {'channel': channel}, broadcast=True)


@socketio.on('join channel')
def join_channel(data):
	"""add a user to a channel"""
	user = data['user']
	channel = data['channel']
	join_room(channel)

	# check if message history exists
	if len(messages[channel])>0:
		emit('load messages', messages[channel])

	# broadcast newly joined user to all users in channel
	emit('user joined', {'user': user, 'channel': channel}, room=channel)


@socketio.on('leave channel')
def leave_channel(data):
	"""remove a user from a channel"""
	user = data['user']
	channel = data['channel']
	leave_room(channel)

	# broadcast user that left to remaining users in channel
	emit('user left', {'user': user, 'channel': channel}, room=channel)


@socketio.on('new message')
def new_message(data):
	"""add a message to a channel"""
	user = data['user']
	channel = data['channel']
	message = data['message']

	# get timestamp
	timestamp = datetime.now()
	timestamp = timestamp.strftime("%Y-%m-%d %H:%M")

	# update message format, add new message to list of existing messages
	message = {'user': user, 'message': message, 'timestamp': timestamp}
	messages[channel].append(message)

	# check if number of messages stored exceeds limit
	if len(messages[channel])>limit:
		messages[channel].pop(0)

	# broadcast new message to all users in channel
	emit('accept message', message, room=channel)


@socketio.on('new file')
def new_file(data):
	"""upload a file to a channel"""
	# get timestamp, add timestamp to data
	timestamp = datetime.now()
	timestamp = timestamp.strftime("%Y-%m-%d %H:%M")
	data['timestamp'] = timestamp

	# add new file to list of existing messages
	message = {'file_array': data['file_array'], 'file_name': data['file_name'], 'file_type': data['file_type'], 'file_size': data['file_size']}
	message = {'user': data['user'], 'message': message, 'timestamp': timestamp}
	messages[data['channel']].append(message)

	# check if number of messages stored exceeds limit
	if len(messages[data['channel']])>limit:
		messages[data['channel']].pop(0)

	# broadcast new file to all users in channel
	emit('accept file', data, room=data['channel'])