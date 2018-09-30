const program = require('commander');
const path = require('path');
const fs = require('fs-extra');
const {merge: deepMerge} = require('lodash');
const pkg = require('../package.json');


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

    await require('../lib/create')(dbConfig, entityPath);
}

run();

