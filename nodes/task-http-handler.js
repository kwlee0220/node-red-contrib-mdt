
const axios = require('axios');
const { MDTInstanceManager, handleRequestError } = require('./mdt-platform');
const { getMDTInstanceManager, toVariableJsonList } = require('./utils');
const { HttpPoller } = require('./http-poller');

function handleInput(msg, config, node) {
    const manager = getMDTInstanceManager(node, config);
    const serverEndpoint = config.serverEndpoint;
    if (!serverEndpoint) {
        node.error("Server endpoint는 필수 설정입니다.");
        return;
    }
    const operationId = config.operationId;
    if (!operationId) {
        node.error("연산 식별자(operationId)는 필수 설정입니다.");
        return;
    }
    const inputVariables = config.inputVariables || [];
    const outputVariables = config.outputVariables || [];

    try {
        // 요청 데이터 구성
        const opServerUrl = `${config.serverEndpoint}/operations`;
        const requestData = {
            operation: config.operationId,
            inputVariables: toVariableJsonList(inputVariables),
            outputVariables: toVariableJsonList(outputVariables),
            async: true
        };
        
        // POST 요청 실행
        axios.post(opServerUrl, requestData)
            .then(startResp => {
                node.log('POST 요청 성공, sessionId: ' + startResp.data.session);
                awaitTaskFinished(startResp, config, node, msg);
            })
            .catch(error => {
                node.error('POST 요청 실패: ' + error.message);
                node.status({});
            });
    } catch (error) {
        node.error('요청 데이터 구성 중 오류 발생: ' + error.message);
    }
}

function awaitTaskFinished(startResp, config, node, msg) {
    const sessionId = startResp.data.session;
    const pollUrl = `${config.serverEndpoint}/sessions/${sessionId}`;
    
    // 설정값 파싱
    const timeoutMs = config.timeout ? parseInt(config.timeout) * 1000 : null;
    const pollIntervalMs = parseFloat(config.poll || 1.0) * 1000;
    const startTime = Date.now();

    node.log('Polling URL: ' + pollUrl + ", timeout: " + timeoutMs + "ms");
    
    // polling 시작
    const poller = new HttpPoller(pollUrl, startTime, timeoutMs, pollIntervalMs,
        (pollResp, node, msg) => {
            node.log('Polling result: ' + JSON.stringify(pollResp.data));
            return pollResp.data.status;
        },
        (pollResp, node, msg) => {
            msg.payload = pollResp.data.result;
            node.send(msg);
            node.status({});
        },
        (pollResp, node, msg) => {
            node.status({});
        },
        node, msg);
    poller.poll();
}

module.exports = {
    handleInput
}; 