const program = require('commander');
const pkg = require('../package.json');

// program
//     .version(pkg.version)
//     .usage('[options] <name>')
//     .option('-c, --chdir <dir>', 'Change the working directory', process.cwd())
//     .option('-f, --state-file <path>', 'Set path to state file', '.migrate')
//     .option('-s, --store <store>', 'Set the migrations store', path.join(__dirname, '..', 'lib', 'file-store'))
//     .option('--clean', 'Tears down the migration state before running up')
//     .option('-F, --force', 'Force through the command, ignoring warnings')
//     .option('--init', 'Runs init for the store')
//     .option('--migrations-dir <dir>', 'Change the migrations directory name', 'migrations')
//     .option('--matches <glob>', 'A glob pattern to filter migration files', '*')
//     .option('--compiler <ext:module>', 'Use the given module to compile files')
//     .option('--env [name]', 'Use dotenv to load an environment file')
//     .parse(process.argv);
const Sequelize = require('sequelize');

const sequelize = require('../lib/sequelize')({
    dialect: 'mysql',
    database: 'needs_dccs',
    username: 'root',
    password: 'admin@123',
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
    },
});
if (!sequelize) {
    process.exit(1);
}

const queryInterface = sequelize.getQueryInterface();

queryInterface.describeTable('test_zhang').then((data, data1, data2) => {
    console.log("describeTable===", data);
});

queryInterface.showIndex('test_zhang').then((data, data1, data2) => {
    console.log("showIndex===", JSON.stringify(data));
});

queryInterface.showConstraint('test_zhang').then((data, data1, data2) => {
    console.log("showConstraint===", data);
});

queryInterface.createTable(
    'test_zhang12',
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        attr2: Sequelize.INTEGER(15),
        attr3: {
            type: Sequelize.STRING,
            comment: '测试attr3attr3'
        },
        attr4: Sequelize.DATE,
        attr5: Sequelize.DECIMAL,
        attr6: Sequelize.DECIMAL(11),
        attr7: Sequelize.DECIMAL(11, 2),
        attr8: Sequelize.DATEONLY,
    }
);

// queryInterface.addIndex(
//     'test_zhang',
//     ['attr1'],
//     {
//         indexName: 'test_un_index',
//         indicesType: 'UNIQUE'
//     }
// );
