//node migrate-create.js --entity-file ../entity/demo/test-zhang.js --db-config-path ../config
module.exports = {
    tableName: 'test_zhang12',
    columns: {
        attr1: {
            type: 'integer',
            length: 11,
            allowNull: false,
            defaultValue: 0,
            comment: '地址ID'
        },
        attr6: {
            type: 'decimal',
            allowNull: false,
            defaultValue: 0.01,
            comment: '测试attr6attr6'
        }
    },
    indexs: {
        index_orderId: {
            fields: ['orderId', 'attr6'],
            type: 'UNIQUE'
        }
    }
};