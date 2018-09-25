exports = module.exports = migrate;

function migrate(title, up, down) {
    console.log(title, up, down);
    // migration
    if (typeof title === 'string' && up && down) {
        migrate.set.addMigration(title, up, down);
        // specify migration file
    } else if (typeof title === 'string') {
        migrate.set = exports.load(title);
        // no migration path
    } else if (!migrate.set) {
        throw new Error('must invoke migrate(path) before running migrations');
        // run migrations
    } else {
        return migrate.set;
    }
}