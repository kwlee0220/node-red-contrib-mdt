const { MDTInstanceManager, handleRequestError } = require('./mdt-platform');
const { getMDTInstanceManager } = require('./utils');

module.exports = function(RED) {
    "use strict";
    
    function GetInstanceNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // input 이벤트 핸들러 설정
        node.on('input', function(msg) {
            getInstance(msg, config, node);
        });
    }
    
    RED.nodes.registerType("get instance", GetInstanceNode);
};

function getInstance(msg, config, node) {
    const manager = getMDTInstanceManager(node, config);
    const instanceId = msg.payload?.instanceId || config.instanceId;
    
    if (!instanceId) {
        node.error("Instance ID는 필수 설정입니다.");
        return;
    }

    manager.getInstance(instanceId)
        .then(response => {
            msg.payload = response;
            node.send(msg);
        })
        .catch(error => {
            handleRequestError(error, node);
        });
} 