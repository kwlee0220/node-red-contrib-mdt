const { handleInput } = require('./update-sme-handler');

module.exports = function(RED) {
    "use strict";
    
    function UpdateSmeNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // input 이벤트 핸들러 설정
        node.on('input', function(msg) {
            handleInput(msg, config, node);
        });
    }
    
    RED.nodes.registerType("update sme", UpdateSmeNode);
}; 