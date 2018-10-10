const program = require('commander');
const path = require('path');
const fs = require('fs-extra');
const {merge: deepMerge} = require('lodash');
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

        let entityPath = program.entityPath;
        if (!entityPath) {
            entityPath = process.env['MIGRATE_ENTITY_PATH'];
            if (!entityPath) {
                console.error('entity path is empty');
                process.exit(1);
            }
            console.log(`use MIGRATE_ENTITY for entity path: ${entityPath}`);
        }

        if (!(await fs.exists(entityPath))) {
            console.error(`'${entityPath}' does not exist`);
            process.exit(1);
        }

        const result = await require('../lib/create')(dbConfig, entityPath);
        const fileData = await ejs.renderFile(path.join(__dirname, '..', 'template', 'migrate-file.ejs'), {
            up: result.up,
            down: result.down
        });

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
            await fs.mkdirp(migrationsPath);
        }
        const fileName = `${getCurrentYYYYMMDDHHmms()}-migration.js`;
        await fs.writeFile(path.join(migrationsPath, fileName), fileData);
        console.log(`migration file '${fileName}' created!`);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

function getCurrentYYYYMMDDHHmms() {
    const date = new Date();
    return [
        date.getFullYear(),
        format(date.getMonth() + 1),
        format(date.getDate()),
        format(date.getHours()),
        format(date.getMinutes()),
        format(date.getSeconds())
    ].join('');
}

function format(i) {
    return parseInt(i, 10) < 10 ? '0' + i : i;
}

run();