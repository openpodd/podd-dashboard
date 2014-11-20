'use strict';

var io = require('socket.io')(8888),
    Fiber = require('fibers'),
    sleep = function sleep(ms) {
        var fiber = Fiber.current;

        setTimeout(function () {
            fiber.run();
        }, ms);

        Fiber.yield();
    },

    redis = require('redis'),

    fs = require('fs'),
    dataset = JSON.parse(fs.readFileSync('../app/api/dashboard.json'));

var producer = redis.createClient(),
    consumer = redis.createClient();

// Randomly generate village status.
// Fiber(function () {
//     var i = 0, positive, negative, index, data;
//
//     for (;;i++) {
//         // Prepare data.
//         positive = parseInt(Math.random() * 100);
//         negative = parseInt(Math.random() * 100);
//
//         index = parseInt(Math.random() * 10) % 2;
//         data = dataset[index];
//         data.positive = positive;
//         data.negative = negative;
//
//         producer.publish('village:status', JSON.stringify(data));
//
//         sleep(10000 * Math.random());
//     }
// }).run();

consumer.on('message', function (channel, message) {
    console.log('New upcoming message from channel: /', channel, '/');
    var i;

    for (i in io.sockets.connected) {
        console.log('---------', io.sockets.connected[i]);
        io.sockets.connected[i].emit(channel, message);
    }
});
consumer.subscribe('report:new', 'report:comment:new', 'report:image:new', 'mention:new');

io.on('connection', function (socket) {
    console.log('client connected id:', socket.conn.id,
                ' from:', socket.handshake.headers.origin);
});

io.serveClient();
console.log('Listening on 0.0.0.0:8888 ...');
