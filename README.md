# Project 2
https://i.imgur.com/bn6dch8.png

## Demo
https://youtu.be/H9MNmUkHG8Y

## Functions
### 1. Display Name
If a user is visiting for the first time, they will be prompted to enter a display name before they can enter the application. If they entered a display name that is already taken, they will be alerted. If a user is a returning user, they will automatically enter the application with the display name they previously entered and be redirected to the channel they last joined.

### 2. Create Channel
A user can create any new channel as long as the channel name entered does not already exist. A newly created channel will automatically be added to the list of existing channels. A 'general' channel is created by default.

### 3. Join Channel
By clicking on any channel from the channel list, a user will join that channel and be redirected to that channel's room. Messages previously sent in that channel, if any, will automatically be loaded. Only the 100 most recent messages is stored.

### 4. Send Message
Enabled only when a user joins a channel. Messages sent by a user will be visible to all other users who joined the same channel. When a user joins/leaves a channel, a notification message will automatically be sent. Supports the sending of attachments, which will be sent as a message with a download link **(personal touch)**.

## Files
### 1. application.py
Python file that renders `index.html` and performs socket events. Created global variables `users`, `channels` and `messages` to store data as well as `limit` to specify the maximum number of recent messages to store.

### 2. index.html
HTML file that sets the layout of the application. Certain elements are dynamically set based on user behaviour, such as the inner HTMLs for `#user` and `#channel-name`.

### 3. script.js
JavaScript file that connects to a websocket and listen for events. Also where the storing of data across browser sessions occur.

### 4.style.css
CSS stylesheet that sets the design of the application.