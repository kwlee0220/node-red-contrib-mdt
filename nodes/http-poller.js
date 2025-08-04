const axios = require('axios');

class HttpPoller {
    constructor(pollUrl, startTime, timeoutMs, pollIntervalMs, getStatus, onCompleted, onFailed, node, msg) {
        this.pollUrl = pollUrl;
        this.startTime = startTime;
        this.timeoutMs = timeoutMs;
        this.pollIntervalMs = pollIntervalMs;
        this.getStatus = getStatus;
        this.onCompleted = onCompleted;
        this.onFailed = onFailed;
        this.node = node;
        this.msg = msg;
    }

    poll() {
        axios.get(this.pollUrl)
            .then(pollResp => {
                const status = this.getStatus(pollResp, this.node, this.msg);
                this.node.log('Polling 결과 - Status: ' + status);
                
                switch (status) {
                    case 'RUNNING':
                        this.node.status({ fill: "yellow", shape: "dot", text: "진행중..." });
                        this.handleRunningStatus();
                        break;
                    case 'COMPLETED':
                        this.node.log('Polling is completed.');
                        this.onCompleted(pollResp, this.node, this.msg);
                        this.node.status({});
                        break;
                    case 'FAILED':
                        this.node.error('Polling is failed: ' + JSON.stringify(pollResp.data));
                        this.onFailed(pollResp, this.node, this.msg);
                        this.node.status({});
                        break;
                    default:
                        this.node.error('알 수 없는 polling 상태: ' + status);
                }
            })
            .catch(error => {
                this.node.error('Polling 중 오류 발생: ' + error.message);
                this.node.status({});
            });
    }

    handleRunningStatus() {
        if (this.timeoutMs && (Date.now() - this.startTime) >= this.timeoutMs) {
            this.node.error(`Polling expired timeout: ${this.timeoutMs}ms`);
            return;
        }
        
        this.node.log('wait for ' + this.pollIntervalMs + 'ms');
        setTimeout(() => this.poll(), this.pollIntervalMs);
    }
}

module.exports = {
    HttpPoller
};