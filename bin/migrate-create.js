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
        .option('--entity-path <path>', 'Set entity file path')
        .option('--db-config-path <path>', 'Set db config path')
        .option('--migrations-path <path>', 'Set migrations out path')
        .parse(process.argv);
    try {
        const dbConfig = await utils.getDBconfig(program.dbConfigPath);
        const entityPath = await utils.getEntityPath(program.entityPath);
        const result = await require('../lib/migrate/create')(dbConfig, entityPath);
        const fileData = await ejs.renderFile(path.join(__dirname, '..', 'template', 'migrate-file.ejs'), {
            up: result.up,
            down: result.down
        });

        const migrationsPath = utils.getMigrationsPath(program.migrationsPath);
        if (!(await fs.exists(migrationsPath))) {
            await fs.mkdirp(migrationsPath);
        }
        const fileName = `${utils.getCurrentYYYYMMDDHHmms()}-migration.js`;
        await fs.writeFile(path.join(migrationsPath, fileName), fileData);
        console.log(`migration file '${fileName}' created!`);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}


run();