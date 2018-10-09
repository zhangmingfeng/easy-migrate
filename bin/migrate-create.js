const program = require('commander');
const path = require('path');
const fs = require('fs-extra');
const {merge: deepMerge} = require('lodash');
const pkg = require('../package.json');
const util = require('util');
const ejs = require('ejs');

async function run() {
    program
        .version(pkg.version)
        .usage('[options] <name>')
        .option('--entity-path <path>', 'Set entity file path', path.join(__dirname, '..', 'entity'))
        .option('--entity-file <file>', 'Set entity file, when need to migrate a file')
        .option('--db-config-path <path>', 'Set db config path', path.join(__dirname, '..', 'config'))
        .option('--migrations-path <path>', 'Set migrations out path', path.join(__dirname, '..', 'migrations'))
        .parse(process.argv);

    const dbConfigPath = program.dbConfigPath;
    if (!(await fs.exists(path.join(dbConfigPath, 'index.js')))) {
        console.error(`${path.join(dbConfigPath, 'config.js')} does not exist`);
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
    if (program.entityFile) {
        entityPath = path.join(entityPath, program.entityFile);
    }
    if (!(await fs.exists(entityPath))) {
        console.error(`${entityPath} does not exist`);
        process.exit(1);
    }

    const result = await require('../lib/create')(dbConfig, entityPath);
    const fileData = await ejs.renderFile(path.join(__dirname, '..', 'template', 'migrate-file.ejs'), {
        up: result.up,
        down: result.down
    });
    const migrationsPath = program.migrationsPath;
    if (!(await fs.exists(migrationsPath))) {
        await fs.mkdirp(migrationsPath);
    }
    const fileName = `${getCurrentYYYYMMDDHHmms()}-migration.js`;
    await fs.writeFile(path.join(migrationsPath, fileName), fileData);
    console.log(`migration file '${fileName}' generated!`);
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
};

run();

