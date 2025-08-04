const axios = require('axios');
const https = require('https');
const { MDTInstanceManager } = require('./mdt-platform');


function getMDTInstanceManager(node, config) {
    const flowContext = node.context().flow

    const mdtEndpoint = config.mdtEndpoint || process.env.MDT_ENDPOINT;
    if (!mdtEndpoint) {
        node.error("MDTPlatform endpoint가 설정되지 않았습니다.");
        throw new Error("MDTPlatform endpoint가 설정되지 않았습니다.");
    }

    return new MDTInstanceManager(mdtEndpoint, node);
}

module.exports = {
    getMDTInstanceManager
}; 