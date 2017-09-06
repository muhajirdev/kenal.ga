const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`)
})

// TODO: Implement `/totalUser` REST API
// app.get('/totalUser', (req, res) => {
//     res.send(totalUser)
// })

const queue = []
const rooms = {}
const allUsers = {}
let totalUser = 0

io.on('connection', (socket) => {
    totalUser += 1
    allUsers[socket.id] = socket
    console.log(`User ${socket.id} connected. Now ${totalUser} users online`)

    socket.on('join', () => {
        let friend = queue.pop()
        if (friend) {
            let room = socket.id + '#' + friend.id
            rooms[socket.id] = room
            rooms[friend.id] = room

            socket.join(room)
            friend.join(room)

            io.in(room).emit('chat message', 'Welcome to room ' + room)
        } else {
            queue.push(socket)
            io.in(socket.id).emit('chat message', 'Please Wait')
        }
    })

    socket.on('chat message', function (msg) {
        room = rooms[socket.id]
        io.in(room).emit('chat message', msg)
    })

    socket.on('disconnect', function () {
        room = rooms[socket.id]
        if (room) {
            friendId = room.split('#')
            friendId = friendId[0] === socket.id ? friendId[1] : friendId[0]

            friend = allUsers[friendId]

            friend.leave(room)
            socket.leave(room)

            io.in(friend.id).emit('friend disconnect')
            
            delete rooms[socket.id]
            delete rooms[friend.id]
        }

        // Clear Queue
        if (queue.includes(socket)) {
            queue.pop()
        }

        totalUser -= 1
        delete allUsers[socket.id]
        console.log(`User ${socket.id} disconnected. Now ${totalUser} online`)
    })
})

http.listen(3000, () => {
    console.log('Listening on port 3000')
})