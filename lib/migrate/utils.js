const Sequelize = require('sequelize');

module.exports = {
    async createVersionTable(queryInterface) {
        const tableExist = await queryInterface.tableExist('migrate_version');
        if (tableExist) {
            return true;
        }
        await queryInterface.createTable('migrate_version', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            versionId: {
                type: Sequelize.STRING(20),
                allowNull: false,
                comment: '版本ID'
            },
            preVersionId: {
                type: Sequelize.STRING(20),
                comment: '上一个版本ID'
            }
        });
        await queryInterface.addIndex('migrate_version', {
            fields: ['versionId'],
            type: 'UNIQUE',
            name: 'index_un_versionId'
        });
        return true;
    },

    async getCurrVersion(sequelize) {
        const version = await sequelize.query('select versionId from migrate_version order by versionId desc limit 1;', {
            type: sequelize.QueryTypes.SELECT
        });
        if (version && version[0]) {
            return parseInt(version[0].versionId, 10);
        }
        return 0;
    },

    async getPreVersion(sequelize) {
        const version = await sequelize.query('select preVersionId from migrate_version order by versionId desc limit 1;', {
            type: sequelize.QueryTypes.SELECT
        });
        if (version && version[0]) {
            return parseInt(version[0].preVersionId, 10);
        }
        return 0;
    },

    async getPreVersionByVersionId(sequelize, versionId) {
        const version = await sequelize.query(`select preVersionId from migrate_version where versionId = ? limit 1;`, {
            replacements: [versionId],
            type: sequelize.QueryTypes.SELECT
        });
        if (version && version[0]) {
            return parseInt(version[0].preVersionId, 10);
        }
        return 0;
    },

    validateVersion(version) {
        if (isNaN(version)) {
            console.error(`invalid version: ${version}`);
            return 0;
        }
        if (version.length !== 14) {
            console.error(`invalid version: ${version}`);
            return 0;
        }
        return parseInt(version, 10);
    },

    async saveVersion(sequelize, version, preVersion) {
        return await sequelize.query(`insert into migrate_version (versionId, preVersionId) values (?, ?);`, {
            replacements: [version, preVersion],
            type: sequelize.QueryTypes.INSERT
        });
    },

    async deleteVersion(sequelize, versionId) {
        return await sequelize.query(`delete from migrate_version where versionId = ?`, {
            replacements: [versionId],
            type: sequelize.QueryTypes.DELETE
        });
    }
};