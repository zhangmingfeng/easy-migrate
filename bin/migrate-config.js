#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
    .version(pkg.version)
    .option('--env [name]', 'show env name')
    .parse(process.argv);
const envName = program.env;
if (!envName) {
    console.log(`MIGRATE_DB_CONFIG_PATH: '${process.env['MIGRATE_DB_CONFIG_PATH'] === undefined ? '' : process.env['MIGRATE_DB_CONFIG_PATH']}',
MIGRATE_DEFINE_PATH: '${process.env['MIGRATE_DEFINE_PATH'] === undefined ? '' : process.env['MIGRATE_DEFINE_PATH']}',
MIGRATE_MIGRATIONS_PATH: '${process.env['MIGRATE_MIGRATIONS_PATH'] === undefined ? '' : process.env['MIGRATE_MIGRATIONS_PATH']}',
MIGRATE_MODEL_PATH: '${process.env['MIGRATE_MODEL_PATH'] === undefined ? '' : process.env['MIGRATE_MODEL_PATH']}'`);
} else {
    console.log(`${envName}: '${process.env[envName] === undefined ? '' : process.env[envName] }'`);
}
