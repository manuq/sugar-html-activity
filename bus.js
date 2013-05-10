define(function(require) {
    var lastId = 0;
    var callbacks = {};
    var messageQueue = [];
    var socket = null;

    function start() {
        socket = new WebSocket("ws://localhost:" + window.sugarPort);

        socket.onopen = function() {
            socket.send(JSON.stringify({"method": "authenticate",
                                        "id": "authenticate",
                                        "params": [window.sugarKey]}));

            while (messageQueue.length > 0) {
                socket.send(messageQueue.pop());
            }
        };

        socket.onmessage = function(message) {
            var parsed = JSON.parse(message.data);
            var responseId = parsed.id;
            if (responseId in callbacks) {
                callbacks[responseId](parsed.result);
                delete callbacks[responseId];
            } 
        };
    }

    if (window.sugarKey) {
        start();
    } else {
        window.onSugarKeySet = function() {
            start();
        }
    }

    var Bus = {};

    Bus.sendMessage = function(method, params, callback) {
        message = {"method": method,
                   "id": lastId,
                   "params": params};

        callbacks[lastId] = callback;

        var stringMessage = JSON.stringify(message);

        if (socket.readyState == WebSocket.OPEN) {
            socket.send(stringMessage);
        } else {
            messageQueue.push(stringMessage);
        }

        lastId++;
    };

    return Bus;
});
