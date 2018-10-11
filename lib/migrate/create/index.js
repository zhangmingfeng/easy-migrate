const fs = require('fs-extra');
const constant = require('../../constant');
const generateExecute = require('./generate-execute');
const migrateInfo = {
    up: {
        columns: {
            create: [],
            modify: [],
            drop: []
        },
        index: {
            add: [],
            drop: []
        }
    },
    down: {
        columns: {
            create: [],
            modify: [],
            drop: []
        },
        index: {
            add: [],
            drop: []
        }
    },
};
module.exports = async (dbConfig, entityPath) => {
    const sequelize = require('../../sequelize')(dbConfig);
    if (!sequelize) {
        process.exit(1);
    }
    const queryInterface = sequelize.getQueryInterface();
    const stats = await fs.stat(entityPath);
    if (stats.isFile()) {
        const entity = require(entityPath);
        const tableExist = await queryInterface.tableExist(entity.tableName);
        if (!tableExist) {
            migrateInfo.up.columns.create.push(generateExecute.tableCreate(entity.tableName, attributesToSequelizeOrm(entity.columns)));
            migrateInfo.down.columns.drop.push(generateExecute.tableDrop(entity.tableName));
            migrateInfo.up.index.add.push(...generateExecute.indexCreate(entity.tableName, entity.indexs));
        } else {
            await columnChange(entity.tableName, entity.columns, queryInterface);
            await indexChange(entity.tableName, entity.indexs, queryInterface);
        }
    }
    sequelize.close();
    return migrateInfo;
};

function attributesToSequelizeOrm(attributes) {
    const result = {};
    for (const column in attributes) {
        const type = attributes[column].type;
        const length = attributes[column].length || 0;
        const precision = attributes[column].precision || 0;
        const scale = attributes[column].scale || 0;
        result[column] = {
            type: getSequelizeOrmType(type, length, precision, scale)
        };
        for (const prop in attributes[column]) {
            if (prop === 'type' || prop === 'length' || prop === 'precision' || prop === 'scale') {
                continue;
            }
            result[column][prop] = attributes[column][prop];
        }
    }
    return result;
}

function getSequelizeOrmType(type, length, precision, scale) {
    if ((type === constant.TYPE_COLUMN_STRING || type === constant.TYPE_COLUMN_INTEGER || type === constant.TYPE_COLUMN_DATE)
        && length > 0) {
        return `Sequelize.${type.toUpperCase()}(${length})`;
    } else if (type === constant.TYPE_COLUMN_DECIMAL) {
        if (precision > 0 && scale === 0) {
            return `Sequelize.${type.toUpperCase()}(${precision})`;
        } else if (precision > 0 && scale > 0) {
            return `Sequelize.${type.toUpperCase()}(${precision}, ${scale})`;
        }
    }
    return `Sequelize.${type.toUpperCase()}`;
}

async function columnChange(tableName, columns, queryInterface) {
    const tableDesc = await queryInterface.describeTable(tableName);
    const comments = await queryInterface.columnComment(tableName);
    const dbEntityColumns = changeToEntityColumns(tableDesc, comments);
    generateColumnChangeUpAndDown(tableName, dbEntityColumns, columns);
}

async function indexChange(tableName, indexs, queryInterface) {
    const dbIndexs = await queryInterface.showIndex(tableName);
    const dbEntityIndexs = changeToEntityIndexs(dbIndexs);
    generateIndexChangeUpAndDown(tableName, dbEntityIndexs, indexs);
}

function changeToEntityColumns(tableDesc, comments) {
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
            type: constant.FIELD_TYPE_MYSQL_TO_ENTITY[type],
            length: length,
            precision: precision,
            scale: scale,
            allowNull: fieldInfo.allowNull,
            defaultValue: fieldInfo.defaultValue || null,
            primaryKey: fieldInfo.primaryKey,
            autoIncrement: fieldInfo.autoIncrement,
            comment: comments[field]
        };
    }
    return result;
}

function changeToEntityIndexs(indexs) {
    if (!indexs) {
        return {};
    }
    const result = {};
    for (const index of indexs) {
        if (index.primary === true) {
            continue;
        }
        result[index.name] = {
            fields: index.fields.map((field) => (field.attribute))
        };
        if (index.unique) {
            result[index.name].type = 'UNIQUE';
        }
    }
    return result;
}

function generateColumnChangeUpAndDown(tableName, dbColumns, fileColumns) {
    fileColumns = fillColumnProperty(fileColumns);
    if (!fileColumns) {
        console.error(`entity defined error`);
        return null;
    }
    if (!dbColumns) {
        console.error(`db entity defined error`);
        return null;
    }
    for (const key in dbColumns) {
        if (!fileColumns.hasOwnProperty(key)) {
            migrateInfo.up.columns.drop.push(generateExecute.columnDrop(tableName, key));
            const downAdd = {};
            const dbColumnType = dbColumns[key].type;
            const dbColumnLength = dbColumns[key].length;
            const dbColumnPrecision = dbColumns[key].precision;
            const dbColumnScale = dbColumns[key].scale;
            downAdd.type = getSequelizeOrmType(dbColumnType, dbColumnLength, dbColumnPrecision, dbColumnScale);
            constant.SEQUELIZE_ATTRIBUTES_WITHOUT_TYPE.forEach((attribute) => {
                if (dbColumns[key][attribute] !== undefined) {
                    downAdd[attribute] = dbColumns[key][attribute];
                }
            });
            migrateInfo.down.columns.create.push(generateExecute.columnAdd(tableName, key, downAdd));
        } else {
            migrateInfo.up.columns.modify.push(generateExecute.columnChange(tableName, key, getColumnChangeAttribute(key, dbColumns, fileColumns, 'up')));
            migrateInfo.down.columns.modify.push(generateExecute.columnChange(tableName, key, getColumnChangeAttribute(key, dbColumns, fileColumns, 'down')));
        }
    }
    for (const key in fileColumns) {
        if (key in dbColumns) {
            continue;
        }
        const add = {};
        const fileColumnType = fileColumns[key].type;
        const fileColumnLength = fileColumns[key].length;
        const fileColumnPrecision = fileColumns[key].precision;
        const fileColumnScale = fileColumns[key].scale;
        add.type = getSequelizeOrmType(fileColumnType, fileColumnLength, fileColumnPrecision, fileColumnScale);
        constant.SEQUELIZE_ATTRIBUTES_WITHOUT_TYPE.forEach((attribute) => {
            if (fileColumns[key][attribute] !== undefined) {
                add[attribute] = fileColumns[key][attribute];
            }
        });
        migrateInfo.up.columns.create.push(generateExecute.columnAdd(tableName, key, add));
        migrateInfo.down.columns.drop.push(generateExecute.columnDrop(tableName, key));
    }
}

function generateIndexChangeUpAndDown(tableName, dbIndexs, fileIndexs) {
    if (!fileIndexs) {
        console.error(`entity defined error`);
        return null;
    }
    if (!dbIndexs) {
        console.error(`db entity defined error`);
        return null;
    }
    for (const key in dbIndexs) {
        if (!fileIndexs.hasOwnProperty(key)) {
            migrateInfo.up.index.drop.push(generateExecute.indexDrop(tableName, key));
            migrateInfo.down.index.add.push(generateExecute.indexCreate(tableName, {
                [key]: dbIndexs[key]
            }));
        } else {
            const dbIndex = dbIndexs[key];
            const fileIndex = fileIndexs[key];
            if (dbIndex.fields.toString() !== fileIndex.fields.toString() || dbIndex.type !== fileIndex.type) {
                migrateInfo.up.index.drop.push(generateExecute.indexDrop(tableName, key));
                migrateInfo.up.index.add.push(generateExecute.indexCreate(tableName, {
                    [key]: fileIndex
                }));

                migrateInfo.down.index.drop.push(generateExecute.indexDrop(tableName, key));
                migrateInfo.down.index.add.push(generateExecute.indexCreate(tableName, {
                    [key]: dbIndex
                }));
            }
        }
    }
    for (const key in fileIndexs) {
        if (key in dbIndexs) {
            continue;
        }
        migrateInfo.up.index.add.push(generateExecute.indexCreate(tableName, {
            [key]: fileIndexs[key]
        }));
        migrateInfo.down.index.drop.push(generateExecute.indexDrop(tableName, key));
    }
}

function getColumnChangeAttribute(key, dbColumns, fileColumns, changeType = 'up') {
    const change = {};
    const fileColumnType = fileColumns[key].type;
    const dbColumnType = dbColumns[key].type;
    const fileColumnLength = fileColumns[key].length;
    const dbColumnLength = dbColumns[key].length;
    const fileColumnPrecision = fileColumns[key].precision;
    const dbColumnPrecision = dbColumns[key].precision;
    const fileColumnScale = fileColumns[key].scale;
    const dbColumnScale = dbColumns[key].scale;
    if (changeType === 'down') {
        if (fileColumnType !== dbColumnType || fileColumnLength !== dbColumnLength
            || fileColumnPrecision !== dbColumnPrecision || fileColumnScale !== dbColumnScale) {
            change.type = getSequelizeOrmType(dbColumnType, dbColumnLength, dbColumnPrecision, dbColumnScale);
        }
        constant.SEQUELIZE_ATTRIBUTES_WITHOUT_TYPE.forEach((attribute) => {
            if (dbColumns[key][attribute] !== fileColumns[key][attribute]) {
                change[attribute] = dbColumns[key][attribute];
            }
        });
    } else {
        if (fileColumnType !== dbColumnType || fileColumnLength !== dbColumnLength
            || fileColumnPrecision !== dbColumnPrecision || fileColumnScale !== dbColumnScale) {
            change.type = getSequelizeOrmType(fileColumnType, fileColumnLength, fileColumnPrecision, fileColumnScale);
        }
        constant.SEQUELIZE_ATTRIBUTES_WITHOUT_TYPE.forEach((attribute) => {
            if (fileColumns[key][attribute] !== dbColumns[key][attribute]) {
                change[attribute] = fileColumns[key][attribute];
            }
        });
    }
    return change;
}

function fillColumnProperty(columns) {
    if (!columns) {
        return null;
    }
    const result = {};
    for (const column in columns) {
        result[column] = {
            type: columns[column].type,
            length: columns[column].length || 0,
            precision: columns[column].precision || 0,
            scale: columns[column].scale || 0,
            allowNull: (columns[column].allowNull === undefined || (columns[column].allowNull !== false && columns[column].allowNull !== true)) ? false : columns[column].allowNull,
            defaultValue: columns[column].defaultValue === undefined ? null : columns[column].defaultValue,
            primaryKey: (columns[column].primaryKey === undefined || (columns[column].primaryKey !== false && columns[column].primaryKey !== true)) ? false : columns[column].primaryKey,
            autoIncrement: (columns[column].autoIncrement === undefined || (columns[column].autoIncrement !== false && columns[column].autoIncrement !== true)) ? false : columns[column].autoIncrement,
            comment: columns[column].comment || ''
        };
    }
    return result;
}