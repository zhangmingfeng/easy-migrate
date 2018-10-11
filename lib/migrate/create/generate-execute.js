module.exports = {
    tableCreate(tableName, attributes) {
        return `await queryInterface.createTable('${tableName}', ${this.outputAttributes(attributes)});`;
    },

    tableDrop(tableName) {
        return `await queryInterface.dropTable('${tableName}');`;
    },

    indexCreate(tableName, indexs) {
        if (!tableName || !indexs) {
            return [];
        }
        const result = [];
        for (const index in indexs) {
            indexs[index].name = index;
            result.push(`await queryInterface.addIndex('${tableName}', ${this.outputIndex(indexs[index])});`);
        }
        return result;
    },

    indexDrop(tableName, indexName) {
        if (!tableName || !indexName) {
            return [];
        }
        return `await queryInterface.removeIndex('${tableName}', '${indexName}');`;
    },

    columnAdd(tableName, column, attribute) {
        return `await queryInterface.addColumn('${tableName}', '${column}', ${this.outputAttribute(attribute)});`;
    },

    columnChange(tableName, column, attribute) {
        return `await queryInterface.changeColumn('${tableName}', '${column}', ${this.outputAttribute(attribute)});`;
    },

    columnDrop(tableName, column) {
        return `await queryInterface.removeColumn('${tableName}', '${column}');`;
    },

    outputAttributes(attributes) {
        if (!attributes) {
            return '{}';
        }
        let result = '{';
        for (const attribute in attributes) {
            const output = this.outputAttribute(attributes[attribute]);
            if (result !== '{') {
                result = `${result},
            ${attribute}: ${output}`;
            } else {
                result = `${result}
            ${attribute}: ${output}`;
            }
        }
        return `${result}
    }`;
    },

    outputAttribute(attribute) {
        if (!attribute) {
            return '{}';
        }
        let result = '{';
        for (const key in attribute) {
            let value = attribute[key];
            if (key !== 'type') {
                value = typeof attribute[key] === 'string' ? `'${attribute[key]}'` : attribute[key];
            }
            if (result !== '{') {
                result = `${result},
            ${key}: ${value}`;
            } else {
                result = `${result}
            ${key}: ${value}`;
            }
        }
        return `${result}
        }`;
    },

    outputIndex(index) {
        if (!index) {
            return '{}';
        }
        let result = '{';
        for (const key in index) {
            let value = index[key];
            if (key === 'fields') {
                value = this.outputArray(value);
            } else {
                value = typeof value === 'string' ? `'${value}'` : value;
            }
            if (result !== '{') {
                result = `${result},
            ${key}: ${value}`;
            } else {
                result = `${result}
            ${key}: ${value}`;
            }
        }
        return `${result}
        }`;
    },

    outputArray(array) {
        if (!array) {
            return '[]';
        }
        let result = '[';
        for (let value of array) {
            value = typeof value === 'string' ? `'${value}'` : value;
            if (result !== '[') {
                result = `${result}, ${value}`;
            } else {
                result = `${result}${value}`;
            }
        }
        return `${result}]`;
    }
};