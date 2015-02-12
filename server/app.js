'use strict';

var config = require('./config');

var io = require('socket.io')(8888),
    redis = require('redis'),
    gcm = require('android-gcm'),
    raven = require('raven'),
    client = new raven.Client(config.sentryDSN, { level: 'error' }),
    consumer = redis.createClient();

var pushGCM = function pushGCM(message) {
    var data = JSON.parse(message),
        gcmObject = new gcm.AndroidGcm(data.GCMAPIKey),
        gcmMessage = new gcm.Message({
            registration_ids: data.androidRegistrationIds,
            data: {
                id: data.id,
                message: data.message,
                type: data.type.toLowerCase()
            }
        });

    gcmMessage.delay_while_idle = true;
    gcmMessage.time_to_live = config.gcm.time_to_live;

    gcmObject.send(gcmMessage, function(err) {
        if (err) {
            console.log('ERROR:', err);
            try {
                var options = {
                    extra: {
                        GCMPayload: gcmMessage
                    },
                    tags: {
                        service: 'gcm'
                    }
                };

                client.captureError(err, options, function (response) {
                    console.log('Sentry Error ID :', response.id);
                });
            }
            catch (err) {
                // Do nothing.
                console.log('- err of err', err);
            }
        }
    });
};

consumer.on('message', function (channel, message) {
    console.log('New upcoming message from channel: /', channel, '/');
    var i;
    for (i in io.sockets.connected) {
        io.sockets.connected[i].emit(channel, message);
    }

    if (channel === 'news:new') {
        pushGCM(message);
    }

});

consumer.subscribe(
    'report:new',
    'report:comment:new',
    'report:image:new',
    'report:flag:new',
    'mention:new',
    'news:new',
    'user:avatar:new'
);

io.on('connection', function (socket) {
    console.log('client connected id:', socket.conn.id,
                ' from:', socket.handshake.headers.origin);
});

io.serveClient();
console.log('Listening on 0.0.0.0:8888 ...');
