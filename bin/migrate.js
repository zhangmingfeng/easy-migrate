#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
    .version(pkg.version)
    .command('create', 'Create a new migration', {isDefault: true})
    .command('up [name]', 'Migrate up to a give migration')
    .command('down [name]', 'Migrate down to a given migration')
    .parse(process.argv);