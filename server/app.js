var io = require('socket.io')(8888),
    Fiber = require('fibers'),
    sleep = function sleep(ms) {
        var fiber = Fiber.current;

        setTimeout(function () {
            fiber.run();
        }, ms);

        Fiber.yield();
    },
    fs = require('fs'),
    dataset = JSON.parse(fs.readFileSync('../app/api/dashboard.json'));

io.on('connection', function (socket) {
    console.log('client connected id:', socket.conn.id,
                ' from:', socket.handshake.headers.origin);

    var loopRun = function () {
        Fiber(function () {
            var i = 0, positive, negative, index, data;

            for (;;i++) {
                // Prepare data.
                positive = parseInt(Math.random() * 100);
                negative = parseInt(Math.random() * 100);

                index = parseInt(Math.random() * 10) % 2;
                data = dataset[index];
                data.positive = positive;
                data.negative = negative;

                socket.emit('villageStatus', data);

                sleep(10000 * Math.random());
            }
        }).run();
    };

    loopRun();
});

io.serveClient();
console.log('Listening on 0.0.0.0:8888');
