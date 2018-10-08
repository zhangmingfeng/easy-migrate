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
        await createColumnChange(entity, queryInterface);
    }
};

async function createColumnChange(entity, queryInterface) {
    const tableName = entity.tableName;
    const tableDesc = await queryInterface.describeTable(tableName);
    const comments = await queryInterface.columnComment(tableName);
    const dbEntityColumns = changeToEntityColumns(tableDesc, comments);
    const result = generateColumnUpAndDown(dbEntityColumns, entity.columns);
    console.log(result.up);
    console.log(result.down);
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
            type: changeDBTypeToFieldType(type),
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

function changeDBTypeToFieldType(dbType) {
    return constant.FIELD_TYPE_MYSQL_TO_ENTITY[dbType];
}

function generateColumnUpAndDown(dbColumns, fileColumns) {
    fileColumns = fillColumnProperty(fileColumns);
    if (!fileColumns) {
        console.error(`entity defined error`);
        return null;
    }
    if (!dbColumns) {
        console.error(`db entity defined error`);
        return null;
    }
    const result = {
        up: {},
        down: {}
    };
    for (const key in dbColumns) {
        if (!fileColumns.hasOwnProperty(key)) {
            if (!result.up.drop) {
                result.up.drop = [];
            }
            if (!result.down.adds) {
                result.down.adds = {};
            }
            result.up.drop.push(key);
            const downAdd = {};
            const dbColumnType = dbColumns[key].type;
            const dbColumnLength = dbColumns[key].length;
            const dbColumnPrecision = dbColumns[key].precision;
            const dbColumnScale = dbColumns[key].scale;
            if ((dbColumnType === constant.TYPE_COLUMN_STRING || dbColumnType === constant.TYPE_COLUMN_INTEGER || dbColumnType === constant.TYPE_COLUMN_DATE)
                && dbColumnLength > 0) {
                downAdd.type = `Sequelize.${dbColumnType.toUpperCase()}(${dbColumnLength})`;
            } else if (dbColumnType === constant.TYPE_COLUMN_DECIMAL) {
                if (dbColumnPrecision > 0 && dbColumnScale === 0) {
                    downAdd.type = `Sequelize.${dbColumnType.toUpperCase()}(${dbColumnPrecision})`;
                } else if (dbColumnPrecision > 0 && dbColumnScale > 0) {
                    downAdd.type = `Sequelize.${dbColumnType.toUpperCase()}(${dbColumnPrecision}, ${dbColumnScale})`;
                }
            } else {
                downAdd.type = `Sequelize.${dbColumnType.toUpperCase()}`;
            }
            if (dbColumns[key].allowNull !== undefined) {
                downAdd.allowNull = dbColumns[key].allowNull;
            }
            if (dbColumns[key].defaultValue !== undefined) {
                downAdd.defaultValue = dbColumns[key].defaultValue;
            }
            if (dbColumns[key].primaryKey !== undefined) {
                downAdd.primaryKey = dbColumns[key].primaryKey;
            }
            if (dbColumns[key].autoIncrement !== undefined) {
                downAdd.autoIncrement = dbColumns[key].autoIncrement;
            }
            if (dbColumns[key].comment !== undefined) {
                downAdd.comment = dbColumns[key].comment;
            }
            result.down.adds[key] = downAdd;
        } else {
            if (!result.up.changes) {
                result.up.changes = {};
            }
            if (!result.down.changes) {
                result.down.changes = {};
            }
            result.up.changes[key] = columnChange(key, dbColumns, fileColumns, 'up');
            result.down.changes[key] = columnChange(key, dbColumns, fileColumns, 'down');
        }
        delete fileColumns[key];
    }
    if (!result.up.adds) {
        result.up.adds = {};
    }
    if (!result.down.drop) {
        result.down.drop = [];
    }
    for (const key in fileColumns) {
        const add = {};
        const fileColumnType = fileColumns[key].type;
        const fileColumnLength = fileColumns[key].length;
        const fileColumnPrecision = fileColumns[key].precision;
        const fileColumnScale = fileColumns[key].scale;
        if ((fileColumnType === constant.TYPE_COLUMN_STRING || fileColumnType === constant.TYPE_COLUMN_INTEGER || fileColumnType === constant.TYPE_COLUMN_DATE)
            && fileColumnLength > 0) {
            add.type = `Sequelize.${fileColumnType.toUpperCase()}(${fileColumnLength})`;
        } else if (fileColumnType === constant.TYPE_COLUMN_DECIMAL) {
            if (fileColumnPrecision > 0 && fileColumnScale === 0) {
                add.type = `Sequelize.${fileColumnType.toUpperCase()}(${fileColumnPrecision})`;
            } else if (fileColumnPrecision > 0 && fileColumnScale > 0) {
                add.type = `Sequelize.${fileColumnType.toUpperCase()}(${fileColumnPrecision}, ${fileColumnScale})`;
            }
        } else {
            add.type = `Sequelize.${fileColumnType.toUpperCase()}`;
        }
        if (fileColumns[key].allowNull !== undefined) {
            add.allowNull = fileColumns[key].allowNull;
        }
        if (fileColumns[key].defaultValue !== undefined) {
            add.defaultValue = fileColumns[key].defaultValue;
        }
        if (fileColumns[key].primaryKey !== undefined) {
            add.primaryKey = fileColumns[key].primaryKey;
        }
        if (fileColumns[key].autoIncrement !== undefined) {
            add.autoIncrement = fileColumns[key].autoIncrement;
        }
        if (fileColumns[key].comment !== undefined) {
            add.comment = fileColumns[key].comment;
        }
        result.up.adds[key] = add;
        result.down.drop.push(key);
    }
    return result;
}

function columnChange(key, dbColumns, fileColumns, changeType = 'up') {
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
            if ((dbColumnType === constant.TYPE_COLUMN_STRING || dbColumnType === constant.TYPE_COLUMN_INTEGER || dbColumnType === constant.TYPE_COLUMN_DATE)
                && dbColumnLength > 0) {
                change.type = `Sequelize.${dbColumnType.toUpperCase()}(${dbColumnLength})`;
            } else if (dbColumnType === constant.TYPE_COLUMN_DECIMAL) {
                if (dbColumnPrecision > 0 && dbColumnScale === 0) {
                    change.type = `Sequelize.${dbColumnType.toUpperCase()}(${dbColumnPrecision})`;
                } else if (dbColumnPrecision > 0 && dbColumnScale > 0) {
                    change.type = `Sequelize.${dbColumnType.toUpperCase()}(${dbColumnPrecision}, ${dbColumnScale})`;
                } else {
                    change.type = `Sequelize.${dbColumnType.toUpperCase()}`;
                }
            } else {
                change.type = `Sequelize.${dbColumnType.toUpperCase()}`;
            }
        }

        if (dbColumns[key].allowNull !== fileColumns[key].allowNull) {
            change.allowNull = dbColumns[key].allowNull;
        }
        if (dbColumns[key].defaultValue !== fileColumns[key].defaultValue) {
            change.defaultValue = dbColumns[key].defaultValue;
        }
        if (dbColumns[key].primaryKey !== fileColumns[key].primaryKey) {
            change.primaryKey = dbColumns[key].primaryKey;
        }
        if (dbColumns[key].autoIncrement !== fileColumns[key].autoIncrement) {
            change.autoIncrement = dbColumns[key].autoIncrement;
        }
        if (dbColumns[key].comment !== fileColumns[key].comment) {
            change.comment = dbColumns[key].comment;
        }
    } else {
        if (fileColumnType !== dbColumnType || fileColumnLength !== dbColumnLength
            || fileColumnPrecision !== dbColumnPrecision || fileColumnScale !== dbColumnScale) {
            if ((fileColumnType === constant.TYPE_COLUMN_STRING || fileColumnType === constant.TYPE_COLUMN_INTEGER || fileColumnType === constant.TYPE_COLUMN_DATE)
                && fileColumnLength > 0) {
                change.type = `Sequelize.${fileColumnType.toUpperCase()}(${fileColumnLength})`;
            } else if (fileColumnType === constant.TYPE_COLUMN_DECIMAL) {
                if (fileColumnPrecision > 0 && fileColumnScale === 0) {
                    change.type = `Sequelize.${fileColumnType.toUpperCase()}(${fileColumnPrecision})`;
                } else if (fileColumnPrecision > 0 && fileColumnScale > 0) {
                    change.type = `Sequelize.${fileColumnType.toUpperCase()}(${fileColumnPrecision}, ${fileColumnScale})`;
                } else {
                    change.type = `Sequelize.${fileColumnType.toUpperCase()}`;
                }
            } else {
                change.type = `Sequelize.${fileColumnType.toUpperCase()}`;
            }
        }
        if (fileColumns[key].allowNull !== dbColumns[key].allowNull) {
            change.allowNull = fileColumns[key].allowNull;
        }
        if (fileColumns[key].defaultValue !== dbColumns[key].defaultValue) {
            change.defaultValue = fileColumns[key].defaultValue;
        }
        if (fileColumns[key].primaryKey !== dbColumns[key].primaryKey) {
            change.primaryKey = fileColumns[key].primaryKey;
        }
        if (fileColumns[key].autoIncrement !== dbColumns[key].autoIncrement) {
            change.autoIncrement = fileColumns[key].autoIncrement;
        }
        if (fileColumns[key].comment !== dbColumns[key].comment) {
            change.comment = fileColumns[key].comment;
        }
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