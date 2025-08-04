module.exports = function(RED) {
    "use strict";
    
    function DownloadFileNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.on('input', function(msg) {
            // download-file-handler.js에서 실제 로직 처리
            const { handleDownload } = require('./download-file-handler');
            handleDownload(node, config, msg);
        });
        
        node.on('close', function() {
            node.status({});
        });
    }
    
    RED.nodes.registerType("download file", DownloadFileNode);
}; 