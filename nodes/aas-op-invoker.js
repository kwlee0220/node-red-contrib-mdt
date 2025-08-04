const axios = require('axios');
const https = require('https');

class AASOperationInvoker {
    constructor(manager, opRefExpr, inputArguments, inoutputArguments, outputArguments,
                pollIntervalMs, timeoutMs, node) {
        this.manager = manager;
        this.opRefExpr = opRefExpr;
        this.inputArguments = inputArguments;       // MDTVariables
        this.inoutputArguments = inoutputArguments; // MDTElementReferences
        this.outputArguments = outputArguments;     // MDTElementReferences
        this.pollIntervalMs = pollIntervalMs;
        this.timeoutMs = timeoutMs;
        this.node = node;
        this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }

    async invoke() {
        this.startTime = Date.now();

        const opUrl = await this.manager.resolveElementReference(this.opRefExpr);
        const invokeUrl = `${opUrl}/invoke-async`;
        this.node.log("[AASOperation] InvokerUrl: " + invokeUrl);

        const request = await this.buildInvokeRequest();
        this.node.log("[AASOperation] Request: " + JSON.stringify(request));
        
        return axios.post(invokeUrl, request, { httpsAgent: this.httpsAgent })
            .then(invokeResp => {
                return `${opUrl}/${invokeResp.headers.location}`;
            })
            .then(pollUrl => {
                this.node.log("[AASOperation] pollUrl: " + pollUrl);
                return this.awaitExecution(pollUrl);
            })
            .catch(error => {
                this.node.error('[AASOperation] Invocation failed: ' + error.message);
                this.node.status({});
            });
    }

    async buildInvokeRequest() {
        // merge inputArguments and inoutputArguments
        const initialValues = this.inputArguments
                                    .concat(this.inoutputArguments)
                                    .map(v => v.toJson());
        this.node.log(`Initial Values: ${JSON.stringify(initialValues)}`);

        return this.manager.initializeOperationVariables(this.opRefExpr, initialValues)
                            .then(opvars => {
                                this.node.log(`Operation Variables: ${JSON.stringify(opvars)}`);
                                return {
                                    inputArguments: opvars.inputVariables,
                                    inoutputArguments: opvars.inoutputVariables,
                                    clientTimeoutDuration: msToIsoDuration(this.timeoutMs)
                                };
                            })
    }

    async awaitExecution(pollUrl) {
        const timeoutStr = (this.timeoutMs) ? `${this.timeoutMs}ms` : "indefinite"
        this.node.log('[AASOperation] awaitExecution: timeout=' + timeoutStr + ', '
                        + 'poll-interval=' + this.pollIntervalMs + 'ms'); 
        while (true) {
            const resp = await axios.get(pollUrl, { httpsAgent: this.httpsAgent })
                                    .then(pollResp => {
                                        return pollResp.data;
                                    })
                                    .catch(error => {
                                        this.node.error('Polling 중 오류 발생: ' + error);
                                        this.node.status({});
                                    });
            this.node.log('[AASOperation] Polling result: status=' + resp.executionState);
            switch (resp.executionState) {
                case 'Running':
                    if (this.timeoutMs && (Date.now() - this.startTime) >= this.timeoutMs) {
                        const timeoutStr = (this.timeoutMs) ? `${this.timeoutMs}ms` : "indefinite"
                        this.node.error(`Polling expired timeout: ${timeoutStr}`);
                        return {
                            executionState: 'Failed',
                            messages: [{
                                message: `Polling expired timeout: ${timeoutStr}`
                            }]
                        };
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
                    break;
                case 'Completed':
                    return resp;
                case 'Failed':
                    return {
                        executionState: 'Failed',
                        messages: [{
                            message: 'Polling is failed: ' + JSON.stringify(resp.messages)
                        }]
                    };
                default:
                    return {
                        executionState: 'Failed',
                        messages: [{
                            message: '알 수 없는 polling 상태: ' + status
                        }]
                    };
            };
        }
    }
}

function msToIsoDuration(ms) {
    if (!ms) return 'P7D';
    else if (ms < 0) throw new Error("음수 duration은 지원되지 않습니다.");

    const totalSeconds = ms / 1000;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = (totalSeconds % 60); // 소수점 포함

    let duration = 'PT';
    if (hours > 0) duration += `${hours}H`;
    if (minutes > 0) duration += `${minutes}M`;

    // 소수점이 있는 초는 항상 포함
    if (seconds > 0 || (hours === 0 && minutes === 0)) {
        duration += `${seconds.toFixed(3).replace(/\.?0+$/, '')}S`; // 끝의 0 제거
    }

    return duration;
}

module.exports = {
    AASOperationInvoker
}; 