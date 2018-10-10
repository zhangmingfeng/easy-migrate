#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
    .version(pkg.version)
    .command('config', 'show migrate config')
    .command('create', 'Create a new migration')
    .command('up', 'Migrate up to a give migration version, default lastest')
    .command('down', 'Migrate down to a given migration version, default current pre-version')
    .parse(process.argv);