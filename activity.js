define(function(require) {
    var activity = {};

    var bus = require("sugar-html-core/bus");

    activity.close = function(callback) {
        bus.sendMessage("activity.close", [], callback);
    };

    return activity;
});
