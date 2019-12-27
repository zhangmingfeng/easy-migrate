const {merge: deepMerge} = require('lodash');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    async getDBconfig(dbConfigPath) {
        if (!dbConfigPath) {
            dbConfigPath = process.env['MIGRATE_DB_CONFIG_PATH'];
            if (!dbConfigPath) {
                console.error('db config is empty');
                process.exit(1);
            }
            console.log(`use MIGRATE_DB_CONFIG_PATH for db config: ${dbConfigPath}`);
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
            },
            logging() {
                // no logger
            }
        };
        let dbConfig = require(path.resolve(dbConfigPath));
        dbConfig = deepMerge(defConfig, dbConfig);
        if (dbConfig.dialect !== 'mysql') {
            console.error('At present, MySQL is only supported');
            process.exit(1);
        }
        return dbConfig;
    },

    async getDefinePath(definePath) {
        if (!definePath) {
            definePath = process.env['MIGRATE_DEFINE_PATH'];
            if (!definePath) {
                console.error('define path is empty');
                process.exit(1);
            }
            console.log(`use MIGRATE_DEFINE_PATH for define path: ${definePath}`);
        }

        if (!(await fs.exists(definePath))) {
            console.error(`'${definePath}' does not exist`);
            process.exit(1);
        }
        return definePath;
    },

    async getModelPath(modelPath) {
        if (!modelPath) {
            modelPath = process.env['MIGRATE_MODEL_PATH'];
            if (modelPath) {
                console.log(`use MIGRATE_MODEL_PATH for model path: ${modelPath}`);
            }
        }
        return modelPath;
    },

    getMigrationsPath(migrationsPath) {
        if (!migrationsPath) {
            migrationsPath = process.env['MIGRATE_MIGRATIONS_PATH'];
            if (!migrationsPath) {
                console.error('migrations path is empty');
                process.exit(1);
            }
            console.log(`use MIGRATE_MIGRATIONS_PATH for migrations path: ${migrationsPath}`);
        }
        return migrationsPath;
    },

    getCurrentYYYYMMDDHHmms() {
        const date = new Date();
        return [
            date.getFullYear(),
            this._format(date.getMonth() + 1),
            this._format(date.getDate()),
            this._format(date.getHours()),
            this._format(date.getMinutes()),
            this._format(date.getSeconds())
        ].join('');
    },

    _format(i) {
        return parseInt(i, 10) < 10 ? '0' + i : i;
    }
};