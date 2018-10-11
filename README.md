# easy-migrate

简单高效的migrate工具，可以根据模型配置文件自动生成迁移语句，开发人员只需要关注配置文件的增删改即可，无需关心迁移的语句

# 特性

- 本工具的模型管理是基于[sequelize](https://github.com/sequelize/sequelize)，如需要手动修改migration文件，请参考它的API
- 模型配置文件简单，目前只支持MySQL，根据配置文件的变化和数据库当前表结构的对比，自动生成迁移语句，开发人员只需要维护配置文件即可
- 根据MySQL常用的数据类型，目前只支持MySQL的INT、VARCHAR、DECIMAL、DATETIME、DATE，其他类型，如FLOAT、DOUBLE,可以使用DECIMAL代替，CHAR使用VARCHAR代替
- 后续版本会支持更多种数据库，sequelize支持的都可以

# 安装

```bash
$ npm i easy-migrate -g
$
$ migrate
Usage: migrate [options] [command]

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  config         show migrate config
  create         Create a new migration
  up             Migrate up to a give migration version, default lastest
  down           Migrate down to a given migration version, default current pre-version
  help [cmd]     display help for [cmd]
```

# 使用
## migrate create

```bash
$ migrate create -h
Usage: migrate-create [options] <name>

Options:
  -V, --version             output the version number
  --entity-path <path>      Set entity file path
  --db-config-path <path>   Set db config path
  --migrations-path <path>  Set migrations out path
  -h, --help                output usage information

```
--entity-path: 执行模型配置文件的目录（项目开发过程中一般按模块开发的话，模型也应该是模块级的），可以是一个文件，也可以通过设置环境变量: MIGRATE_ENTITY_PATH
--db-config-path: 数据库的配置文件路径，也可以通过设置环境变量: MIGRATE_DB_CONFIG_PATH
--migrations-path: 生成的migration文件输出目录，也可以通过设置环境变量: MIGRATE_MIGRATIONS_PATH

```bash
$ migrate create --entity-path /path/to/entity/somemodule --db-config-path /path/to/db/config --migrations-path /path/to/migrations
migration file '20181011164723-migration.js' created!
```
或者
```bash
$ MIGRATE_ENTITY_PATH=/path/to/entity/somemodule MIGRATE_DB_CONFIG_PATH=/path/to/db/config MIGRATE_MIGRATIONS_PATH=/path/to/migrations migrate create
use MIGRATE_DB_CONFIG for db config: /path/to/entity/somemodule
use MIGRATE_ENTITY for entity path: /path/to/db/config
use MIGRATE_MIGRATIONS for migrations path: /path/to/migrations
migration file '20181011164723-migration.js' created!
```

- `20181011164723-migration.js`

```js
'use strict';

/**
* Auto-created by execute migrate-create script, Please do not modify it manually!
*/
module.exports = {
    up: async function (queryInterface, Sequelize) {
        // add columns    
        await queryInterface.createTable('table_test1', {
            columns1: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
            defaultValue: 0,
            primaryKey: true,
            autoIncrement: true,
            comment: 'columns1 comment'
        },
            columns2: {
            type: Sequelize.STRING(32),
            allowNull: false,
            comment: 'columns2 comment'
        },
            columns3: {
            type: Sequelize.DECIMAL(11, 2),
            defaultValue: 0,
            allowNull: true,
            comment: 'columns3 comment'
        },
            columns4: {
            type: Sequelize.DATE,
            comment: 'columns4 comment'
        }
    });    

        // modify columns    

        // drop columns    

        // drop indexs    

        // add indexs    
        await queryInterface.addIndex('table_test1', {
            type: 'UNIQUE',
            fields: ['columns2'],
            name: 'index_columns2_un'
        });    
        await queryInterface.addIndex('table_test1', {
            fields: ['columns3', 'columns4'],
            name: 'index_columns3_columns4'
        });    
    },

    down: async function (queryInterface, Sequelize) {
        // add columns    

        // modify columns    

        // drop columns    
        await queryInterface.dropTable('table_test1');    

        // drop indexs    

        // add indexs    
    }
};
```
数据库配置文件如下:

``` js
module.exports = {
    dialect: 'mysql',
    database: 'database',
    username: 'root',
    password: 'admin@123',
    timezone: '+08:00',
    host: '127.0.0.1',
    port: '3306',
};
```

模型配置文件如下:

```js
module.exports = {
    tableName: 'table_test1',
    columns: {
        columns1: {
            type: 'integer',
            length: 11,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            comment: 'columns1 comment'
        },
        columns2: {
            type: 'string',
            length: 32,
            allowNull: false,
            comment: 'columns2 comment'
        },
        columns3: {
            type: 'decimal',
            precision: 11,
            scale: 2,
            defaultValue: 0.00,
            allowNull: true,
            comment: 'columns3 comment'
        },
        columns4: {
            type: 'date',
            comment: 'columns4 comment'
        }
    },
    indexs: {
        index_columns2_un: {
            type: 'UNIQUE',
            fields: ['columns2']
        },
        index_columns3_columns4: {
            fields: ['columns3', 'columns4']
        }
    }
};
```

## migrate up

```bash
$ migrate up -h
Usage: migrate-up [options] <name>

Options:
  -V, --version               output the version number
  --db-config-path <path>     Set db config path
  --target-version <version>  Migrate up to a give migration version, default lastest
  --migrations-path <path>    Set migrations path
  -h, --help                  output usage information
```
--db-config-path: 数据库的配置文件路径，也可以通过设置环境变量: MIGRATE_DB_CONFIG_PATH
--target-version: 指定迁移的版本，默认是当前migration文件中版本最新的
--migrations-path: migration文件所在目录，也可以通过设置环境变量: MIGRATE_MIGRATIONS_PATH

```bash
$ migrate up --db-config-path /path/to/db/config --migrations-path /path/to/migrations
now version is up to 20181011164723
```
或者
```bash
$ MIGRATE_DB_CONFIG_PATH=/path/to/db/config MIGRATE_MIGRATIONS_PATH=/path/to/migrations migrate up
use MIGRATE_DB_CONFIG for db config: /path/to/db/config
use MIGRATE_MIGRATIONS for migrations path: /path/to/migrations
now version is up to 20181011164723
```

```bash
mysql> show table table_test1;
| table_test1 | CREATE TABLE `table_test1` (
  `columns1` int(11) NOT NULL AUTO_INCREMENT COMMENT 'columns1 comment',
  `columns2` varchar(32) NOT NULL COMMENT 'columns2 comment',
  `columns3` decimal(11,2) DEFAULT '0.00' COMMENT 'columns3 comment',
  `columns4` datetime DEFAULT NULL COMMENT 'columns4 comment',
  PRIMARY KEY (`columns1`),
  UNIQUE KEY `index_columns2_un` (`columns2`),
  KEY `index_columns3_columns4` (`columns3`,`columns4`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 |

```

## migrate down

```bash
$ migrate down -h
Usage: migrate-down [options] <name>

Options:
  -V, --version               output the version number
  --db-config-path <path>     Set db config path
  --target-version <version>  Migrate down to a give migration version, default lastest
  --migrations-path <path>    Set migrations path
  -h, --help                  output usage information

```
--db-config-path: 数据库的配置文件路径，也可以通过设置环境变量: MIGRATE_DB_CONFIG_PATH
--target-version: 指定迁移的版本，默认是当前数据库最新版本
--migrations-path: migration文件所在目录，也可以通过设置环境变量: MIGRATE_MIGRATIONS_PATH

```bash
$ migrate down --db-config-path /path/to/db/config --migrations-path /path/to/migrations
now version is down to 0
```
或者
```bash
$ MIGRATE_DB_CONFIG_PATH=/path/to/db/config MIGRATE_MIGRATIONS_PATH=/path/to/migrations migrate up
use MIGRATE_DB_CONFIG for db config: /path/to/db/config
use MIGRATE_MIGRATIONS for migrations path: /path/to/migrations
now version is down to 0
```

