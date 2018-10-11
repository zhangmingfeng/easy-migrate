const program = require('commander');
const pkg = require('../package.json');
const fs = require('fs-extra');
const utils = require('./utils');

program
    .version(pkg.version)
    .usage('[options] <name>')
    .option('--db-config-path <path>', 'Set db config path')
    .option('--target-version <version>', 'Migrate down to a give migration version, default lastest')
    .option('--migrations-path <path>', 'Set migrations out path')
    .parse(process.argv);

async function run() {
    try {
        const dbConfig = await utils.getDBconfig(program.dbConfigPath);
        let targetVersion = program.targetVersion;
        if (!targetVersion) {
            targetVersion = 'lastest';
        }
        const migrationsPath = utils.getMigrationsPath(program.migrationsPath);
        if (!(await fs.exists(migrationsPath))) {
            console.error(`'${migrationsPath}' does not exist`);
            process.exit(1);
        }
        await require('../lib/migrate/down')(dbConfig, targetVersion, migrationsPath);
    } catch (e) {
        throw e;
        console.error(e.message);
        process.exit(1);
    }
}

run();