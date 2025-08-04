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
    if (!reference) {
        node.error("Reference는 필수 설정입니다.");
        return;
    }
    const outputType = config.outputType || 'value';

    node.status({fill:"green", shape:"dot", text:"Reading SubmodelElement"});
    node.log(`Reading SubmodelElement: ref=${reference}`);
    const promise = ( outputType === 'value' )
                    ? manager.readElementValue(reference)
                    : manager.readElement(reference);
    promise.then(response => {
        // node.log(`Read SubmodelElement: ref=${reference}, value=${JSON.stringify(response)}`);
        msg.payload = response;
        node.send(msg);

        node.log("요청이 성공적으로 완료되었습니다.");
        node.status({});
    }).catch(error => { 
        handleRequestError(error, node);
    });
}

module.exports = {
    handleInput
}; 