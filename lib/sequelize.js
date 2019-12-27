const Sequelize = require('sequelize');
const constant = require('./constant');
const _ = require('lodash');
const QueryGenerator = require('./extends/mysql/query-generator');
module.exports = (options) => {
    const dataBase = options.database;
    if (!dataBase) {
        console.error('database is required');
        return null;
    }
    const username = options.username;
    if (!username) {
        console.error('username is required');
        return null;
    }
    const password = options.password;
    if (!password) {
        console.error('password is required');
        return null;
    }
    const sequelize = new Sequelize(dataBase, username, password, options);
    if (options.dialect === constant.TYPE_MYSQL) {
        sequelize.queryInterface.QueryGenerator = new QueryGenerator({
            options: sequelize.queryInterface.QueryGenerator.options,
            _dialect: sequelize.queryInterface.QueryGenerator._dialect,
            sequelize: sequelize.queryInterface.QueryGenerator.sequelize
        });
        _.extend(sequelize.queryInterface, require('./extends/query-interface'));
        sequelize.dialect.Query = require('./extends/mysql/query');
    }
    return sequelize;
};
