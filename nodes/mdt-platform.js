const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * MDTPlatform의 Instance Manager 기능을 제공하는 클래스
 */
class MDTInstanceManager {
    static HEADER = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    static HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });

    /**
     * MDTInstanceManager 생성자
     * @param {string} mdtEndpoint - MDTPlatform 엔드포인트 URL 
     * @param {Object} node - Node-RED 노드 객체
     */
    constructor(mdtEndpoint, node) {
        this.mdtEndpoint = mdtEndpoint;
        this.node = node;
    }

    /**
     * Element Reference를 해석하여 요청 URL을 반환
     * @param {string} reference - Element Reference
     * @returns {Promise<string>} 요청 URL
     */
    async resolveElementReference(reference) {
        const resolveUrl = `${this.mdtEndpoint}/instance-manager/references/${reference}/$url`;
        const response = await axios.get(resolveUrl);
        return response.data;
    }

    async readElement(reference) {
        const reqUrl = `${this.mdtEndpoint}/instance-manager/references/${reference}`;
        const response = await axios.get(reqUrl);
        return response.data;
    }

    async updateElement(reference, newElement) {
        const reqUrl = `${this.mdtEndpoint}/instance-manager/references/${reference}`;
        this.node.log(`PUT element: requestUrl=${reqUrl}, body=${JSON.stringify(newElement)}`);

        const response = await axios.put(reqUrl, newElement, MDTInstanceManager.HEADER);
        return response.data;
    }

    async readElementValue(reference) {
        const reqUrl = `${this.mdtEndpoint}/instance-manager/references/${reference}/$value`;
        const response = await axios.get(reqUrl);
        return response.data;
    }

    async updateElementValue(reference, newElementValue) {
        const reqUrl = `${this.mdtEndpoint}/instance-manager/references/${reference}/$value`;
        this.node.log(`PUT element value: requestUrl=${reqUrl}, body=${JSON.stringify(newElementValue)}`);

        const response = await axios.put(reqUrl, newElementValue, MDTInstanceManager.HEADER);
        return response.data;
    }

    async getMdtModel(instanceId) {
        const reqUrl = `${this.mdtEndpoint}/instance-manager/instances/${instanceId}/$mdt-model`;
        const response = await axios.get(reqUrl);
        return response.data;
    }

    async initializeOperationVariables(opRefExpr, initializers) {
        const reqUrl = `${this.mdtEndpoint}/instance-manager/initializeOperationVariables`
                        + `?reference=${opRefExpr}`;
        const response = await axios.post(reqUrl, initializers);
        return response.data;
    }

    async uploadFile(filePath, mimeType, fileElementRef) {
        const fileUrl = await this.resolveElementReference(fileElementRef);
        const uploadUrl = fileUrl + "/attachment";

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        // FormData 생성 (브라우저 환경에서는 FormData를 직접 사용할 수 없으므로 
        // multipart/form-data 형식으로 직접 구성)
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        const formData = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="fileName"\r\n\r\n`),
            Buffer.from(`${fileName}\r\n`),
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="contentType"\r\n\r\n`),
            Buffer.from(`${mimeType}\r\n`),
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="content"; filename="${fileName}"\r\n`),
            Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
            fileBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const response = await axios.put(uploadUrl, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': formData.length
            },
            httpsAgent: MDTInstanceManager.HTTPS_AGENT,
            timeout: 30000
        });
        return response.data;
    }

    async downloadFile(dirPath, fileElementRef) {
        const fileElmUrl = await this.resolveElementReference(fileElementRef);
        this.node.log("[File] fileElmUrl " + fileElmUrl);

        const fileElmValueUrl = fileElmUrl + "/$value";
        const fileElmValue = await axios.get(fileElmValueUrl, { httpsAgent: MDTInstanceManager.HTTPS_AGENT })
                                        .then(resp => resp.data.ParameterValue);
        this.node.log("[File] fileElmValue " + JSON.stringify(fileElmValue));
        const fileName = fileElmValue.value;

        const downloadUrl = fileElmUrl + "/attachment";
        this.node.log("[File] downloadUrl " + downloadUrl);
        
        // binary 데이터를 올바르게 처리하기 위해 responseType을 'arraybuffer'로 설정
        const response = await axios.get(downloadUrl, { 
            httpsAgent: MDTInstanceManager.HTTPS_AGENT,
            responseType: 'arraybuffer'
        });

        const fullPath = path.join(dirPath, fileName);
        this.node.log("[File] fullPath " + fullPath);
        
        // arraybuffer를 Buffer로 변환하여 파일에 저장
        const buffer = Buffer.from(response.data);
        fs.writeFileSync(fullPath, buffer);

        return fullPath;
    }
}

/**
 * 요청 오류 처리
 * @param {Error} error - 오류 객체
 * @param {Object} node - Node-RED 노드 객체
 */
function handleRequestError(error, node) {
    node.error(`HTTP 요청 실패: ${error.message}`);
    if (error.response) {
        node.error(`응답 상태: ${error.response.status}`);
        node.error(`응답 데이터: ${JSON.stringify(error.response.data)}`);
    }
}

module.exports = {
    MDTInstanceManager,
    handleRequestError
}; 