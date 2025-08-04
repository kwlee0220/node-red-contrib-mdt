const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { getMDTInstanceManager } = require('./utils');

function handleInput(msg, config, node) {
    node.status({ fill: "yellow", shape: "dot", text: "수행 중..." });

    const manager = getMDTInstanceManager(node, config);
    const reference = (msg.payload && msg.payload.reference) || config.reference;
    const filePath = (msg.payload && msg.payload.filePath) || config.filePath;
    const mimeType = (msg.payload && msg.payload.mimeType) || getMimeType(filePath, config);

    if (!reference) {
        node.error("Reference가 지정되지 않았습니다.");
        node.status({ fill: "red", shape: "ring", text: "Reference 누락" });
        return;
    }

    if (!filePath) {
        node.error("파일 경로가 지정되지 않았습니다.");
        node.status({ fill: "red", shape: "ring", text: "파일 경로 누락" });
        return;
    }

    node.log(`Uploading file: filePath=${filePath}, mimeType=${mimeType}, reference: ${reference}`);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
        node.error(`파일을 찾을 수 없습니다: ${filePath}`);
        node.status({ fill: "red", shape: "ring", text: "파일 없음" });
        return;
    }

    // 파일 읽기
    try {
        manager.uploadFile(filePath, mimeType, reference)
            .then(response => {
                node.log('파일 업로드 성공: ' + JSON.stringify(response));
                msg.payload = response;
                node.send(msg);
                node.status({})
            })
            .catch(error => {
                node.error(`파일 업로드 실패: ${error.message}`);
            });

    } catch (error) {
        node.error(`파일 읽기 실패: ${error.message}`);
        node.status({ fill: "red", shape: "ring", text: "파일 읽기 실패" });
    }
}

function getMimeType(filePath, config) {
    if (config.mimeType && config.mimeType.trim() !== '') {
        return config.mimeType;
    }
    
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.csv': 'text/csv'
    };  
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
    handleInput
}; 