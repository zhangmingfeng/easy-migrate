#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs-extra');
const utils = require('./utils');
const pkg = require('../package.json');
const ejs = require('ejs');

async function run() {
    program
        .version(pkg.version)
        .usage('[options] <name>')
        .option('--define-path <path>', 'Set define file path')
        .option('--db-config-path <path>', 'Set db config path')
        .option('--migrations-path <path>', 'Set migrations out path')
        .option('--model-path <path>', 'Set sequelize model file out path')
        .parse(process.argv);
    try {
        const dbConfig = await utils.getDBconfig(program.dbConfigPath);
        const definePath = await utils.getDefinePath(program.definePath);
        const modelPath = await utils.getModelPath(program.modelPath);
        const {migrateInfo, modelFiles} = await require('../lib/migrate/create')(dbConfig, path.resolve(definePath), path.resolve(modelPath));
        const fileData = await ejs.renderFile(path.join(__dirname, '..', 'template', 'migrate-file.ejs'), {
            up: migrateInfo.up,
            down: migrateInfo.down
        });

        const migrationsPath = utils.getMigrationsPath(program.migrationsPath);
        if (!(await fs.exists(migrationsPath))) {
            await fs.mkdirp(migrationsPath);
        }
        const fileName = `${utils.getCurrentYYYYMMDDHHmms()}-migration.js`;
        await fs.writeFile(path.join(migrationsPath, fileName), fileData);

        for (const fileName in modelFiles) {
            const fileData = await ejs.renderFile(path.join(__dirname, '..', 'template', 'model-defined-file.ejs'), modelFiles[fileName]);
            await fs.writeFile(fileName, fileData);
            console.log(`model defined file '${fileName}' created!`);
        }
        console.log(`migration file '${fileName}' created!`);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}


run();