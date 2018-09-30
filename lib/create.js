const fs = require('fs-extra');
const constant = require('./constant');

module.exports = async (dbConfig, entityPath) => {
    const sequelize = require('../lib/sequelize')(dbConfig);
    if (!sequelize) {
        process.exit(1);
    }
    const queryInterface = sequelize.getQueryInterface();
    const stats = await fs.stat(entityPath);
    if (stats.isFile()) {
        const entity = require(entityPath);
        const tableName = entity.tableName;
        const tableDesc = await queryInterface.describeTable(tableName);
        console.log(tableDesc);
        changeToEntityColumns(tableDesc);
    }
};

function changeToEntityColumns(tableDesc) {
    if (!tableDesc) {
        return {};
    }
    const result = {};
    for (const field in tableDesc) {
        const fieldInfo = tableDesc[field];
        let type = fieldInfo.type;
        let length = type.match(/(\d+)/g);
        if (length === null) {
            length = 0;
        } else {
            type = type.substring(0, type.indexOf('\('));
        }
        let precision = 0, scale = 0;
        if (length) {
            if (length.length > 1) {
                precision = parseInt(length[0], 10);
                scale = parseInt(length[1], 10);
                length = 0;
            } else {
                length = parseInt(length[0], 10);
            }
        }
        result[field] = {
            type: changeDBTypeToFieldType(type),
            length: length,
            precision: precision,
            scale: scale,
            allowNull: fieldInfo.allowNull,
            defaultValue: fieldInfo.defaultValue,
            primaryKey: fieldInfo.primaryKey,
            autoIncrement: fieldInfo.autoIncrement,
        };
    }
    return result;
}

function changeDBTypeToFieldType(dbType) {
    return constant.FIELD_TYPE_MAP_MYSQL[dbType];
}