module.exports = {
    TYPE_MYSQL: 'mysql',
    TYPE_COLUMN_INTEGER: 'integer',
    TYPE_COLUMN_STRING: 'string',
    TYPE_COLUMN_TEXT: 'text',
    TYPE_COLUMN_LONGTEXT: 'longtext',
    TYPE_COLUMN_DECIMAL: 'decimal',
    TYPE_COLUMN_DATE: 'date',
    TYPE_COLUMN_DATEONLY: 'dateonly',
    FIELD_TYPE_MYSQL_TO_ENTITY: {
        INT: 'integer',
        VARCHAR: 'string',
        DECIMAL: 'decimal',
        DATETIME: 'date',
        DATE: 'dateonly',
        TEXT: 'text',
        LONGTEXT: 'longtext'
    },
    SEQUELIZE_ATTRIBUTES_WITHOUT_TYPE: [
        'allowNull',
        'defaultValue',
        'primaryKey',
        'autoIncrement',
        'comment'
    ]
};