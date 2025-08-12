const { MDTInstanceManager, handleRequestError } = require('./mdt-platform');
const { getMDTInstanceManager } = require('./utils');

module.exports = function(RED) {
    "use strict";
    
    function SetInstanceStatusNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // input 이벤트 핸들러 설정
        node.on('input', function(msg) {
            setInstanceStatus(msg, config, node);
        });
    }
    
    RED.nodes.registerType("set instance status", SetInstanceStatusNode);
};

function setInstanceStatus(msg, config, node) {
    const manager = getMDTInstanceManager(node, config);
    const instanceId = msg.payload?.instanceId || config.instanceId;
    const isRunning = msg.payload?.isRunning !== undefined ? msg.payload.isRunning : config.isRunning;
    
    if (!instanceId) {
        node.error("Instance ID는 필수 설정입니다.");
        return;
    }

    if (isRunning === undefined) {
        node.error("isRunning 값은 필수 설정입니다.");
        return;
    }

    manager.setInstanceStatus(instanceId, isRunning)
        .then(response => {
            msg.payload = response;
            node.send(msg);
        })
        .catch(error => {
            handleRequestError(error, node);
        });
} 