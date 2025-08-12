const { MDTInstanceManager, handleRequestError } = require('./mdt-platform');
const { getMDTInstanceManager } = require('./utils');

module.exports = function(RED) {
    "use strict";
    
    function ListInstancesNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // input 이벤트 핸들러 설정
        node.on('input', function(msg) {
            listInstances(msg, config, node);
        });
    }
    
    RED.nodes.registerType("list instances", ListInstancesNode);
};

function listInstances(msg, config, node) {
    const manager = getMDTInstanceManager(node, config);

    manager.getInstanceAll()
        .then(response => {
            msg.payload = response;
            node.send(msg);
        })
        .catch(error => {
            handleRequestError(error, node);
        });
} 