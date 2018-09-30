var program = require('commander');
var pkg = require('../package.json');

program
    .version(pkg.version)
    .command('init', 'Initalize the migrations tool in a project')
    .command('list', 'List migrations and their status')
    .command('create [name]', 'Create a new migration', {isDefault: true})
    .command('up [name]', 'Migrate up to a give migration')
    .command('down [name]', 'Migrate down to a given migration')
    .parse(process.argv);