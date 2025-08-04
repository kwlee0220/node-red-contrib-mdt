const axios = require('axios');
const https = require('https');
const { handleInput } = require('./invoke-handler');

module.exports = function(RED) {
    "use strict";

    function InvokeNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // 실제 동작은 이후 구현
        node.on('input', function(msg) {
          handleInput(msg, config, node);
        });
    }

    RED.nodes.registerType("invoke", InvokeNode);
}; 