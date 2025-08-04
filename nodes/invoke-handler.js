const axios = require('axios');
const https = require('https');
const { getMDTInstanceManager } = require('./utils');
const { AASOperationInvoker } = require('./aas-op-invoker');
const {  MDTReferenceVariable } = require('./mdt-variable');

function handleInput(msg, config, node) {
    node.status({ fill: "yellow", shape: "dot", text: "수행 중..." });

    const manager = getMDTInstanceManager(node, config);
    const opRefExpr = config.operationRef;
    if (!opRefExpr) {
        node.error("연산 참조가 지정되지 않았습니다.");
        return;
    }
    node.log(`Operation Reference: ${opRefExpr}`);

    const inputArguments = toVariableList(regulateArguments(config.inputArguments));
    const inoutputArguments = toVariableList(regulateArguments(config.inoutputArguments));
    const outputArguments = toVariableList(regulateArguments(config.outputArguments));

    node.log(`입력 인자: ${JSON.stringify(inputArguments)}`);
    node.log(`입출력 인자: ${JSON.stringify(inoutputArguments)}`);
    node.log(`출력 인자: ${JSON.stringify(outputArguments)}`);

    const timeoutMs = config.timeout ? parseInt(config.timeout) * 1000 : undefined;
    const pollIntervalMs = parseFloat(config.poll || 1.0) * 1000;
    const invoker = new AASOperationInvoker(manager, opRefExpr, inputArguments, inoutputArguments,
                                                outputArguments, pollIntervalMs, timeoutMs, node);
    invoker.invoke()
        .then(result => {
            node.log('Polling completes: ' + JSON.stringify(result));

            result.outputArguments.forEach(outArg => {
                const outVar = outputArguments.find(v => v.name === outArg.value.idShort);
                if (outVar) {
                    node.log(`Updating output argument: name=${outVar.name}, value=${JSON.stringify(outArg.value)}`);
                    outVar.update(manager, outArg.value);
                }
            });
            result.inoutputArguments.forEach(inoutArg => {
                const outVar = inoutputArguments.find(v => v.name === inoutArg.value.idShort);
                if (outVar) {
                    node.log(`Updating inoutput argument: name=${outVar.name}, value=${JSON.stringify(inoutArg.value)}`);
                    outVar.update(manager, inoutArg.value);
                }
            });

            msg.payload = result;
            node.send(msg);
            node.status({});
        })
        .catch(error => {
            node.error(`AASOperation invocation failed: ${error.message}`);
            msg.payload = error;
            node.send(msg);
            node.status({});
        });
}

function regulateArguments(arguments) {
    if ( !arguments ) {
        return [];
    }
    if (typeof arguments === 'string') {
        try {
            return JSON.parse(arguments);
        } catch (e) {
            return [];
        }
    }
    else {
        return arguments;
    }
}

function toVariableList(argList) {
    return argList.map(arg => {
        return MDTReferenceVariable.fromRefExpr(arg.name, arg.spec);
    })
}

module.exports = {
    handleInput
}; 