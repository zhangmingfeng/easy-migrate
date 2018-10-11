const fs = require('fs-extra');
const path = require('path');
const utils = require('../utils');

module.exports = async (dbConfig, targetVersion, migrationsPath) => {
    const sequelize = require('../../sequelize')(dbConfig);
    if (!sequelize) {
        process.exit(1);
    }
    const queryInterface = sequelize.getQueryInterface();
    await utils.createVersionTable(queryInterface);
    let files = null;
    const migrateFiles = await fs.readdir(migrationsPath);
    let currVersion = await utils.getCurrVersion(sequelize);
    if (targetVersion === 'lastest') {
        files = migrateFiles.filter((file) => (parseInt(file.match(/(\d+)/g)[0], 10) > currVersion));
    } else {
        targetVersion = utils.validateVersion(targetVersion);
        if (!targetVersion) {
            process.exit(1);
        }
        files = migrateFiles.filter((file) => {
            const version = parseInt(file.match(/(\d+)/g)[0], 10);
            return version > currVersion && version <= targetVersion;
        });
        if (!files || files.length === 0) {
            console.error(`invalid version: ${targetVersion} , current version: ${currVersion}`);
            process.exit(1);
        }
    }
    for (const file of files) {
        const migrate = require(path.join(migrationsPath, file));
        await migrate.up(queryInterface, require('sequelize'));
        await utils.saveVersion(sequelize, parseInt(file.match(/(\d+)/g)[0], 10), currVersion);
        currVersion = parseInt(file.match(/(\d+)/g)[0], 10);
    }
    console.log(`now version is up to ${currVersion}`);
    sequelize.close();
};