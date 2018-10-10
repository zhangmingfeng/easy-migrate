const fs = require('fs-extra');
const constant = require('../constant');
const Sequelize = require('sequelize');

module.exports = async (dbConfig, targetVersion, migrationsPath) => {
    const sequelize = require('../sequelize')(dbConfig);
    if (!sequelize) {
        process.exit(1);
    }
    const queryInterface = sequelize.getQueryInterface();
    await createVersionTable(queryInterface);
    let files = null;
    if (targetVersion === 'lastest') {
        const currVersion = await getCurrVersion(sequelize);
        const migrateFiles = await fs.readdir(migrationsPath);
        files = migrateFiles.filter((file) => (file.match(/(\d+)/g)[0] > currVersion));
        console.log(files);
    }
    sequelize.close();
};

async function createVersionTable(queryInterface) {
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
}

async function getCurrVersion(sequelize) {
    const version = await sequelize.query('select max(versionId) as versionId from migrate_version', {
        type: sequelize.QueryTypes.SELECT
    });
    return parseInt(version[0].versionId, 10);
}