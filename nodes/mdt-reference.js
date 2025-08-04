
class MDTElementReference {
    async readValue(manager) {
        return manager.readElementValue(this.toStringExpr());
    }
    async read(manager) {
        return manager.readElement(this.toStringExpr());
    }

    async update(manager, newElement) {
        return manager.updateElement(this.toStringExpr(), newElement);
    }
    async updateValue(manager, newElementValue) {
        return manager.updateElementValue(this.toStringExpr(), newElementValue);
    }

    toStringExpr() { }
    toString() { return this.toStringExpr(); }
    toJson() { }

    static fromRefExpr(refExpr) {
        const parts = refExpr.split(':');
        switch (parts[0]) {
            case 'param':
                return new MDTParameterReference(refExpr);
            case 'oparg':
                return new MDTOperationArgumentReference(refExpr);
            default:
                return new MDTDefaultElementReference(refExpr);
        }
    }
}

class MDTDefaultElementReference extends MDTElementReference {
    constructor(refExpr) {
        super(refExpr);

        const [instanceId, smIdShort, elementPath] = refExpr.split(':');
        this.instanceId = instanceId;
        this.smIdShort = smIdShort;
        this.elementPath = elementPath;
    }

    toStringExpr() {
        return `${this.instanceId}:${this.smIdShort}:${this.elementPath}`;
    }

    toJson() {
        return {
            "@type": "mdt:ref:element",
            submodelReference: {
                instanceId: this.instanceId,
                submodelIdShort: this.smIdShort
            },
            elementPath: this.elementPath
        };
    }
}


class MDTParameterReference extends MDTElementReference {
    constructor(refExpr) {
        super(refExpr);

        const [tag, instanceId, paramId, subPath] = refExpr.split(':');
        this.instanceId = instanceId;
        this.paramId = paramId;
        this.subPath = subPath;
    }

    toStringExpr() {
        if ( this.subPath ) {
            return `param:${this.instanceId}:${this.paramId}:${this.subPath}`;
        } else {
            return `param:${this.instanceId}:${this.paramId}`;
        }
    }

    toJson() {
        return {
            "@type": "mdt:ref:param",
            instanceId: this.instanceId,
            parameterId: this.paramId,
            subPath: this.subPath
        };
    }
}

class MDTOperationArgumentReference extends MDTElementReference {
    constructor(refExpr) {
        super(refExpr);

        const [tag, instanceId, smIdShort, kind, argumentSpec] = refExpr.split(':');
        this.instanceId = instanceId;
        this.smIdShort = smIdShort;
        this.kind = kind;
        this.argumentSpec = argumentSpec;
    }

    toStringExpr() {
        return `oparg:${this.instanceId}:${this.smIdShort}:${this.kind}:${this.argumentSpec}`;
    }

    toJson() {
        return {
            "@type": "mdt:ref:oparg",
            submodelReference: {
                instanceId: this.instanceId,
                submodelIdShort: this.smIdShort
            },
            kind: this.kind,
            argumentSpec: this.argumentSpec
        };
    }
}

module.exports = {
    MDTElementReference,
    MDTDefaultElementReference,
    MDTParameterReference,
    MDTOperationArgumentReference
};