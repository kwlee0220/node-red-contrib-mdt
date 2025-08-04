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
    const reference = (msg.payload && msg.payload.reference) || config.reference;
    if ( !reference ) {
        node.error("Reference가 설정되지 않았습니다. 노드 설정의 Reference 값이나 msg.payload.reference를 확인해주세요.");
        return;
    }
    node.log(`Reference: ${reference}`);

    const value = (msg.payload && msg.payload.value) || config.value;
    if ( !value || value === "" ) {
        node.error("Value가 설정되지 않았습니다. 노드 설정의 Value 값이나 msg.payload.value를 확인해주세요.");
        return;
    }
    node.log(`Value: ${value}`);

    node.status({fill:"green", shape:"dot", text:"Updating element value"});
    manager.updateValueOfElementReference(reference, value)
        .then(response => {
            node.log(`Updated SubmodelElement: ref=${reference}, value=${value}`);

            msg.payload = response;
            node.send(msg);
            node.status({});
        })
        .catch(error => {
            handleRequestError(error, node);
        });
}

module.exports = {
    handleInput,
}; 