define(function(require) {
    var port = null;
    var lastId = 0;
    var callbacks = {};
    var messageQueue = [];
    var socket = null;

    function start() {
        var search = window.location.search;
        var port = search.split("=")[1];

        socket = new WebSocket("ws://localhost:" + port);

        socket.onopen = function() {
            while (messageQueue.length > 0) {
                socket.send(messageQueue.pop());
            }
        }

        socket.onmessage = function(message) {
            parsed = JSON.parse(message.data);
            responseId = parsed["id"];
            if (responseId in callbacks) {
                callbacks[responseId](parsed["result"]);
                delete callbacks[responseId];
            } 
        }
    };

    var Bus = {};

    Bus.sendMessage = function(method, params, callback) {
        if (socket == null) {
            start();
        }

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
