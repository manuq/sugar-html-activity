define(function(require) {
    var lastId = 0;
    var callbacks = {};
    var queue = [];
    var socket = null;

    function start() {
        socket = new WebSocket("ws://localhost:" + window.sugarPort);

        socket.onopen = function() {
            params = [window.sugarId, window.sugarKey]

            socket.send(JSON.stringify({"method": "authenticate",
                                        "id": "authenticate",
                                        "params": params}));

            while (queue.length > 0) {
                socket.send(queue.pop());
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

    function sendOrQueue(data) {
        if (socket.readyState == WebSocket.OPEN) {
            socket.send(data);
        } else {
            queue.push(data);
        }
    }

    if (window.sugarKey &&
        window.sugarPort &&
        window.sugarId) {
        start();
    } else {
        window.onSugarAuthSet = function() {
            start();
        }
    }

    var Bus = {};

    function OutputStream() {
        this.streamId = null;
    };

    OutputStream.prototype.open = function(callback) {
        var me = this;
        Bus.sendMessage("open_stream", [], function(result) {
            me.streamId = result;
            callback();
        });
    };

    OutputStream.prototype.write = function(data) {
        var buffer = new ArrayBuffer(data.byteLength + 1);

        var bufferView = new Uint8Array(buffer);
        bufferView[0] = this.streamId;
        bufferView.set(new Uint8Array(data), 1);

        Bus.sendBinary(buffer);
    };

    OutputStream.prototype.close = function() {
        Bus.sendMessage("close_stream", [this.streamId]);
    };

    Bus.createOutputStream = function(callback) {
        return new OutputStream();
    };

    Bus.sendMessage = function(method, params, callback) {
        message = {"method": method,
                   "id": lastId,
                   "params": params};

        if (callback) {
            callbacks[lastId] = callback;
        }

        sendOrQueue(JSON.stringify(message));

        lastId++;
    };

    Bus.sendBinary = function(buffer, callback) {
        sendOrQueue(buffer);
    };

    return Bus;
});
