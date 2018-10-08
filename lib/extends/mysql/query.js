'use strict';

const MysqlQuery = require('sequelize/lib/dialects/mysql/query');

class Query extends MysqlQuery {
    constructor(connection, sequelize, options) {
        super(connection, sequelize, options);
    }

    formatResults(data) {
        let result = this.instance;

        if (this.isInsertQuery(data)) {
            this.handleInsertQuery(data);

            if (!this.instance) {
                // handle bulkCreate AI primiary key
                if (
                    data.constructor.name === 'ResultSetHeader'
                    && this.model
                    && this.model.autoIncrementAttribute
                    && this.model.autoIncrementAttribute === this.model.primaryKeyAttribute
                    && this.model.rawAttributes[this.model.primaryKeyAttribute]
                ) {
                    const startId = data[this.getInsertIdField()];
                    result = [];
                    for (let i = startId; i < startId + data.affectedRows; i++) {
                        result.push({[this.model.rawAttributes[this.model.primaryKeyAttribute].field]: i});
                    }
                } else {
                    result = data[this.getInsertIdField()];
                }
            }
        }

        if (this.isSelectQuery()) {
            result = this.handleSelectQuery(data);
        } else if (this.isShowTablesQuery()) {
            result = this.handleShowTablesQuery(data);
        } else if (this.isDescribeQuery()) {
            result = {};

            for (const _result of data) {
                const enumRegex = /^enum/i;
                result[_result.Field] = {
                    type: enumRegex.test(_result.Type) ? _result.Type.replace(enumRegex, 'ENUM') : _result.Type.toUpperCase(),
                    allowNull: _result.Null === 'YES',
                    defaultValue: _result.Default,
                    primaryKey: _result.Key === 'PRI',
                    autoIncrement: _result.Extra === 'auto_increment'
                };
            }
        } else if (this.isShowIndexesQuery()) {
            result = this.handleShowIndexesQuery(data);

        } else if (this.isCallQuery()) {
            result = data[0];
        } else if (this.isBulkUpdateQuery() || this.isBulkDeleteQuery() || this.isUpsertQuery()) {
            result = data.affectedRows;
        } else if (this.isVersionQuery()) {
            result = data[0].version;
        } else if (this.isForeignKeysQuery()) {
            result = data;
        } else if (this.isInsertQuery() || this.isUpdateQuery()) {
            result = [result, data.affectedRows];
        } else if (this.isShowConstraintsQuery()) {
            result = data;
        } else if (this.isRawQuery()) {
            // MySQL returns row data and metadata (affected rows etc) in a single object - let's standarize it, sorta
            result = [data, data];
        } else if (this.isColumnCommentQueryQuery()) {
            result = {};
            for (const _result of data) {
                result[_result.COLUMN_NAME] = _result.COLUMN_COMMENT || '';
            }
        }
        return result;
    }

    isColumnCommentQueryQuery() {
        return this.options.type === 'COLUMNCOMMENT';
    }
}

module.exports = Query;
module.exports.Query = Query;
module.exports.default = Query;
