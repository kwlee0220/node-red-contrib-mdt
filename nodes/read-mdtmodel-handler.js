const { MDTInstanceManager, handleRequestError } = require('./mdt-platform');
const { getMDTInstanceManager } = require('./utils');

/**
 * Node-RED input 이벤트 핸들러 함수
 * @param {Object} msg - Node-RED 메시지 객체
 * @param {Object} config - 노드 설정 정보
 * @param {Object} node - Node-RED 노드 객체
 */
function handleInput(msg, config, node) {
    const manager = getMDTInstanceManager(node, config);
    const instanceId = config.instanceId;
    if (!instanceId) {
        node.error("MDTInstance 식별자는 필수 설정입니다.");
        return;
    }
    
    node.status({fill:"green", shape:"dot", text:"Reading MDTModel: instance=" + instanceId});
    node.log(`Reading MDTModel: instanceId=${instanceId}`);

    manager.getMdtModel(instanceId)
        .then(response => {
            msg.payload = response;
            node.send(msg);
            node.status({});
        })
        .catch(error => {
            handleRequestError(error, node);
        });
}

module.exports = {
    handleInput
}; 