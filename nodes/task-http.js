const axios = require('axios');
const https = require('https');
const { handleInput } = require('./task-http-handler');

module.exports = function(RED) {
    "use strict";

    function TaskHttpNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // 실제 동작은 이후 구현
        node.on('input', function(msg) {
          handleInput(msg, config, node);
        });
    }

    RED.nodes.registerType("task http", TaskHttpNode);
}; 