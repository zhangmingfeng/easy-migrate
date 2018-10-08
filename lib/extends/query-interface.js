const _ = require('lodash');
module.exports = {
    columnComment(tableName, columnName, options) {
        let schema = null;
        let schemaDelimiter = null;

        if (typeof options === 'string') {
            schema = options;
        } else if (typeof options === 'object' && options !== null) {
            schema = options.schema || null;
            schemaDelimiter = options.schemaDelimiter || null;
        }

        if (typeof tableName === 'object' && tableName !== null) {
            schema = tableName.schema;
            columnName = tableName.columnName;
            tableName = tableName.tableName;
        }
        const sql = this.QueryGenerator.columnCommentQuery(tableName, columnName, schema, schemaDelimiter);

        return this.sequelize.query(
            sql,
            _.assign({}, options, {type: 'COLUMNCOMMENT'})
        ).then(data => {
            if (_.isEmpty(data)) {
                return Promise.reject('No comments found for "' + tableName + '" table. Check the table name and schema; remember, they _are_ case sensitive.');
            } else {
                return Promise.resolve(data);
            }
        });
    }
};