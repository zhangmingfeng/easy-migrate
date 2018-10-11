const fs = require('fs-extra');
const utils = require('../utils');
const path = require('path');

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
    let preVersion = await utils.getPreVersion(sequelize);
    if (targetVersion === 'lastest') {
        files = migrateFiles.filter((file) => (parseInt(file.match(/(\d+)/g)[0], 10) === currVersion));
        if (!files || files.length === 0) {
            console.error(`cannot down to version: ${preVersion}, migration file is not exist`);
            process.exit(1);
        }
    } else {
        targetVersion = utils.validateVersion(targetVersion);
        if (!targetVersion) {
            process.exit(1);
        }
        files = migrateFiles.filter((file) => {
            const version = parseInt(file.match(/(\d+)/g)[0], 10);
            return version <= currVersion && version > targetVersion;
        });
        if (!files || files.length === 0) {
            console.error(`invalid version: ${targetVersion} , current version: ${currVersion}`);
            process.exit(1);
        }
    }
    files.sort((a, b) => (a < b));
    for (const file of files) {
        const migrate = require(path.join(migrationsPath, file));
        await migrate.down(queryInterface, require('sequelize'));
        currVersion = await utils.getPreVersionByVersionId(sequelize, file.match(/(\d+)/g)[0], 10);
        await utils.deleteVersion(sequelize, file.match(/(\d+)/g)[0], 10);
    }
    console.log(`now version is down to ${currVersion}`);
    sequelize.close();
};