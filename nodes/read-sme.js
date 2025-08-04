const axios = require('axios');
const https = require('https');
const { handleInput } = require('./read-sme-handler');

module.exports = function(RED) {
    "use strict";
    
    function ReadSmeNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // input 이벤트 핸들러 설정
        node.on('input', function(msg) {
            handleInput(msg, config, node);
        });
    }
    
    RED.nodes.registerType("read sme", ReadSmeNode);
}; 