const program = require('commander');
const pkg = require('../package.json');
const fs = require('fs-extra');
const {merge: deepMerge} = require('lodash');

program
    .version(pkg.version)
    .usage('[options] <name>')
    .option('--db-config-path <path>', 'Set db config path')
    .option('--target-version <name>', 'Migrate up to a give migration version, default lastest')
    .option('--migrations-path <path>', 'Set migrations out path')
    .parse(process.argv);

async function run() {
    try {
        let dbConfigPath = program.dbConfigPath;
        if (!dbConfigPath) {
            dbConfigPath = process.env['MIGRATE_DB_CONFIG_PATH'];
            if (!dbConfigPath) {
                console.error('db config is empty');
                process.exit(1);
            }
            console.log(`use MIGRATE_DB_CONFIG for db config: ${dbConfigPath}`);
        }
        if (!(await fs.exists(dbConfigPath))) {
            console.error(`'${dbConfigPath}' does not exist`);
            process.exit(1);
        }

        const defConfig = {
            dialect: 'mysql',
            timezone: '+08:00',
            host: '127.0.0.1',
            port: '3306',
            dialectOptions: {
                supportBigNumbers: true,
                bigNumberStrings: true
            },
            define: {
                freezeTableName: true,
                charset: 'utf8',
                dialectOptions: {
                    collate: 'utf8_general_ci'
                },
                timestamps: false
            }
        };
        let dbConfig = require(dbConfigPath);
        dbConfig = deepMerge(defConfig, dbConfig);
        if (dbConfig.dialect !== 'mysql') {
            console.error('At present, MySQL is only supported');
            process.exit(1);
        }
        let targetVersion = program.targetVersion;
        if (!targetVersion) {
            targetVersion = 'lastest';
        }

        let migrationsPath = program.migrationsPath;
        if (!migrationsPath) {
            migrationsPath = process.env['MIGRATE_MIGRATIONS_PATH'];
            if (!migrationsPath) {
                console.error('migrations path is empty');
                process.exit(1);
            }
            console.log(`use MIGRATE_MIGRATIONS for migrations path: ${migrationsPath}`);
        }
        if (!(await fs.exists(migrationsPath))) {
            console.error(`'${migrationsPath}' does not exist`);
            process.exit(1);
        }
        const result = await require('../lib/up')(dbConfig, targetVersion, migrationsPath);
    } catch (e) {
        throw e;
        console.error(e.message);
        process.exit(1);
    }
}

run();