const queryTypes = require('sequelize/lib/query-types');

module.exports = {
    ...queryTypes,
    COLUMNCOMMENT: 'COLUMNCOMMENT',
    TABLEEXIST: 'TABLEEXIST'
};