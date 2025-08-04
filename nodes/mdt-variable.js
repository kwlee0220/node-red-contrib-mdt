
const { MDTInstanceManager, handleRequestError } = require('./mdt-platform');
const { MDTElementReference } = require('./mdt-reference');


class MDTVariable {
    constructor(name) {
        this.name = name;
    }

    async readValue(manager) { }
    async write(manager, newElement) { }
    toJson() { }
}

class MDTReferenceVariable extends MDTVariable {
    constructor(name, reference) {
        super(name);
        this.reference = reference;
    }

    async readValue(manager) {
        return this.reference.readValue(manager);
    }
    async read(manager) {
        return this.reference.read(manager);
    }

    async updateValue(manager, newElementValue) {
        return this.reference.updateValue(manager, newElementValue);
    }
    async update(manager, newElement) {
        return this.reference.update(manager, newElement);
    }

    static fromRefExpr(name, refExpr) {
        const reference = MDTElementReference.fromRefExpr(refExpr);
        return new MDTReferenceVariable(name, reference);
    }

    toJson() {
        return {
            "@type": "mdt:variable:reference",
            name: this.name,
            reference: this.reference.toJson()
        };
    }
}

module.exports = {
    MDTVariable,
    MDTReferenceVariable
};