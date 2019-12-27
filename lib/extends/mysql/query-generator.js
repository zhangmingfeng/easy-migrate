const QueryGenerator = require('sequelize/lib/dialects/mysql/query-generator');
const Utils = require('sequelize/lib/utils');
const _ = require('lodash');

class MyQueryGenerator extends QueryGenerator {
    attributeToSQL(attribute, options) {
        if (!_.isPlainObject(attribute)) {
            attribute = {
                type: attribute
            };
        }

        const attributeString = attribute.type.toString({escape: this.escape.bind(this)});
        let template = attributeString;

        if (attribute.allowNull === false) {
            template += ' NOT NULL';
        }

        if (attribute.autoIncrement) {
            template += ' auto_increment';
        }

        // BLOB/TEXT/GEOMETRY/JSON cannot have a default value
        if (!_.includes(['BLOB', 'TEXT', 'GEOMETRY', 'JSON'], attributeString) && attribute.type._binary !== true && Utils.defaultValueSchemable(attribute.defaultValue)) {
            template += ' DEFAULT ' + this.escape(attribute.defaultValue);
        }

        if (attribute.unique === true) {
            template += ' UNIQUE';
        }

        if (attribute.primaryKey) {
            template += ' PRIMARY KEY';
        }

        if (attribute.first) {
            template += ' FIRST';
        }
        if (attribute.after) {
            template += ' AFTER ' + this.quoteIdentifier(attribute.after);
        }

        if (attribute.comment) {
            template += ` COMMENT '${attribute.comment}'`;
        }

        if (attribute.references) {

            if (options && options.context === 'addColumn' && options.foreignKey) {
                const attrName = this.quoteIdentifier(options.foreignKey);
                const fkName = this.quoteIdentifier(`${options.tableName}_${attrName}_foreign_idx`);

                template += `, ADD CONSTRAINT ${fkName} FOREIGN KEY (${attrName})`;
            }

            template += ' REFERENCES ' + this.quoteTable(attribute.references.model);

            if (attribute.references.key) {
                template += ' (' + this.quoteIdentifier(attribute.references.key) + ')';
            } else {
                template += ' (' + this.quoteIdentifier('id') + ')';
            }

            if (attribute.onDelete) {
                template += ' ON DELETE ' + attribute.onDelete.toUpperCase();
            }

            if (attribute.onUpdate) {
                template += ' ON UPDATE ' + attribute.onUpdate.toUpperCase();
            }
        }
        return template;
    }

    columnCommentQuery(tableName, columnName) {
        const columnNameWhere = columnName ? ` AND COLUMN_NAME = '${columnName}';` : ';';
        return `SELECT COLUMN_NAME, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'${columnNameWhere}`;
    }

    tableExistQuery(tableName) {
        return `SHOW TABLES LIKE '${tableName}'`;
    }
}

module.exports = MyQueryGenerator;