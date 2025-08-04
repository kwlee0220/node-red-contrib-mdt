const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getMDTInstanceManager } = require('./utils');


function handleDownload(node, config, msg) {
    try {
        const manager = getMDTInstanceManager(node, config);
        const reference = config.reference;
        const downloadDir = config.downloadDir;
        
        node.log(`Downloading file: reference=${reference}, downloadDir=${downloadDir}`);
        
        // 필수 파라미터 검증
        if (!reference) {
            node.error("Reference가 지정되지 않았습니다.");
            node.status({ fill: "red", shape: "ring", text: "Reference 누락" });
            return;
        }
        
        if (!downloadDir) {
            node.error("다운로드 디렉토리가 지정되지 않았습니다.");
            node.status({ fill: "red", shape: "ring", text: "디렉토리 누락" });
            return;
        }
        
        // 디렉토리 존재 여부 확인 및 생성
        if (!fs.existsSync(downloadDir)) {
            try {
                fs.mkdirSync(downloadDir, { recursive: true });
                node.log(`디렉토리가 생성되었습니다: ${downloadDir}`);
            } catch (error) {
                node.error(`디렉토리 생성 실패: ${error.message}`);
                node.status({ fill: "red", shape: "ring", text: "디렉토리 생성 실패" });
                return;
            }
        }
        
        // 디렉토리인지 확인
        const stats = fs.statSync(downloadDir);
        if (!stats.isDirectory()) {
            node.error("지정된 경로가 디렉토리가 아닙니다.");
            node.status({ fill: "red", shape: "ring", text: "디렉토리가 아님" });
            return;
        }
        
        node.status({ fill: "blue", shape: "dot", text: "다운로드 중..." });

        manager.downloadFile(downloadDir, reference)
            .then(response => {
                msg.payload = response;
                node.send(msg);
                node.status({});
            })
            .catch(error => {
                node.error("[File] downloadFile error " + JSON.stringify(error));
                node.status({});
            });
        
    } catch (error) {
        node.error(`다운로드 처리 중 오류 발생: ${error.message}`);
        node.status({ fill: "red", shape: "ring", text: "오류 발생" });
    }
}

async function downloadFileFromMDT(node, manager, reference, downloadDir, msg) {
    try {
        // MDT Platform API를 통해 파일 다운로드
        const response = await axios({
            method: 'GET',
            url: `${manager.endpoint}/files/${encodeURIComponent(reference)}`,
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${manager.token}`,
                'Accept': '*/*'
            },
            httpsAgent: manager.httpsAgent
        });
        
        // 파일명 결정 (Content-Disposition 헤더에서 원본 파일명 추출)
        let finalFileName;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                finalFileName = filenameMatch[1].replace(/['"]/g, '');
            }
        }
        
        // 헤더에서 파일명을 찾을 수 없으면 기본 파일명 사용
        if (!finalFileName) {
            finalFileName = `downloaded_file_${Date.now()}`;
        }
        
        // 전체 파일 경로 생성
        const fullFilePath = path.join(downloadDir, finalFileName);
        
        // 파일 스트림 생성
        const writer = fs.createWriteStream(fullFilePath);
        
        let downloadedBytes = 0;
        const totalBytes = parseInt(response.headers['content-length']) || 0;
        
        // 다운로드 진행률 모니터링
        response.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (totalBytes > 0) {
                const progress = Math.round((downloadedBytes / totalBytes) * 100);
                node.status({ fill: "blue", shape: "dot", text: `다운로드 중... ${progress}%` });
            }
        });
        
        // 파일 쓰기 완료 처리
        writer.on('finish', () => {
            const fileStats = fs.statSync(fullFilePath);
            
            node.log(`파일 다운로드 완료: ${fullFilePath} (${fileStats.size} bytes)`);
            node.status({ fill: "green", shape: "dot", text: "다운로드 완료" });
            
            // 출력 메시지 생성
            const outputMsg = {
                ...msg,
                payload: {
                    success: true,
                    filePath: fullFilePath,
                    fileName: finalFileName,
                    fileSize: fileStats.size,
                    downloadTime: new Date().toISOString(),
                    reference: reference
                }
            };
            
            node.send(outputMsg);
        });
        
        // 에러 처리
        writer.on('error', (error) => {
            node.error(`파일 쓰기 오류: ${error.message}`);
            node.status({ fill: "red", shape: "ring", text: "파일 쓰기 실패" });
        });
        
        // 스트림 연결
        response.data.pipe(writer);
        
    } catch (error) {
        if (error.response) {
            // HTTP 에러 응답
            const statusCode = error.response.status;
            const errorMessage = error.response.data?.message || `HTTP ${statusCode} 오류`;
            
            node.error(`다운로드 실패 (${statusCode}): ${errorMessage}`);
            node.status({ fill: "red", shape: "ring", text: `HTTP ${statusCode}` });
        } else if (error.request) {
            // 네트워크 오류
            node.error(`네트워크 오류: ${error.message}`);
            node.status({ fill: "red", shape: "ring", text: "네트워크 오류" });
        } else {
            // 기타 오류
            node.error(`다운로드 오류: ${error.message}`);
            node.status({ fill: "red", shape: "ring", text: "다운로드 오류" });
        }
    }
}

module.exports = {
    handleDownload
}; 