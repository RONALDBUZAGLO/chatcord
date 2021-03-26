const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./utils/users');

const path = require('path');
const { createSocket } = require('dgram');
const PORT = 3000 || process.env.PORT;
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));

const botName = "chatbot"

//Run when client connects
io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{

    const user = userJoin(socket.id,username,room);

    socket.join(user.room)

    //Welcome current user
    socket.emit('message',formatMessage(botName,'Welcome to ChatCord!'));

    //Broadcast when a user connects
    socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage(botName,`${user.username} has joined the chat`)
        );

    //Send users and room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    });

    });
    
    //Listen to message
    socket.on ('chatMessage',(msg)=>{
    const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    //Runs when client disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);
        if(user){
            io
            .to(user.room)
            .emit('message',formatMessage(botName,`${user.username} has left the chat`));
            
            //Send users and room info
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }
    });
});

server.listen(PORT,()=>{ console.log(`Server running on port ${PORT}`) });
