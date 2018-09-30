const QueryGenerator = require('sequelize/lib/dialects/mysql/query-generator');

module.exports = {
    __proto__: QueryGenerator,
    //增加comment
    attributesToSQL(attributes, options) {
        const result = {};
        for (const key in attributes) {
            const attribute = attributes[key];
            let sql = this.attributeToSQL(attribute, options);
            if (attribute.comment) {
                sql += ` COMMENT '${attribute.comment}'`;
            }
            result[attribute.field || key] = sql;
        }
        return result;
    }
};