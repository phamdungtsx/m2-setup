#!/usr/bin/env node

const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const fs = require('fs')
const inquirer = require('inquirer')
const _ = require('lodash')
const fuzzy = require('fuzzy')
const path = require('path')
const { exec } = require("child_process")

const bin = 'Source/server/bin/magento'

if (!fs.existsSync(bin)) {
    console.log('Project Magento was not found.')
    process.exit()
}

fs.chmodSync(bin, 0755)

clear()

console.log(
    chalk.yellow(
        figlet.textSync(path.basename(process.cwd()), { horizontalLayout: 'full' })
    )
);

try {
    const composer = JSON.parse(fs.readFileSync('Source/server/composer.json', { encoding: 'utf8', flag: 'r' }))
    composer.name === 'magento/project-community-edition' && console.log('Magento CE ' + composer.version);
    composer.name === 'magento/project-enterprise-edition' && console.log('Magento EE ' + composer.version);
}
catch (e) {}

try {
    const posConfigData = fs.readFileSync('Source/server/app/code/Magestore/Webpos/etc/config.xml', { encoding: 'utf8', flag: 'r' });
    const line = posConfigData.match(/<line>(.+?)<\/line>/)
    const version = posConfigData.match(/<version>(.+?)<\/version>/)
    console.log(line[1] + ' ' + version[1] + "\n");
}
catch (e) {}

const install_command = (cfg) => {
    return `php -d memory_limit=-1 ${bin} setup:install --base-url=${cfg.ssl ? 'https://' : 'http://'}${cfg.base_url} \
    --db-host=${cfg.db_host} --db-name=${cfg.db_name === "default by domain" ? cfg.base_url.replace(/\./g, '_') : cfg.db_name} --db-user=${cfg.db_user} --db-password=${cfg.db_password} \
    --admin-firstname=${cfg.admin_firstname} --admin-lastname=${cfg.admin_lastname} --admin-email=${cfg.admin_email} \
    --admin-user=${cfg.admin_user} --admin-password=${cfg.admin_password} \
    --use-rewrites=1 --backend-frontname=${cfg.backend_frontname}`;
}

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

inquirer.prompt([
    {
        type: 'input',
        name: 'base_url',
        message: 'Domain',
    },
    {
        type: 'confirm',
        name: 'ssl',
        message: 'Https ?',
    },
    {
        type: 'input',
        name: 'db_host',
        message: 'DB Host',
        default: function () {
            return '127.0.0.1';
        },
    },
    {
        type: 'input',
        name: 'db_name',
        message: 'DB Name',
        default: function () {
            return 'default by domain';
        },
    },
    {
        type: 'input',
        name: 'db_user',
        message: 'DB User',
        default: function () {
            return 'root';
        },
    },
    {
        type: 'input',
        name: 'db_password',
        message: 'DB Password',
        default: function () {
            return 'root';
        },
    },
    {
        type: 'input',
        name: 'admin_firstname',
        message: 'Admin Firstname',
        default: function () {
            return 'admin';
        },
    },
    {
        type: 'input',
        name: 'admin_lastname',
        message: 'Admin Lastname',
        default: function () {
            return 'admin';
        },
    },
    {
        type: 'input',
        name: 'admin_email',
        message: 'Admin Email',
        default: function () {
            return 'admin@admin.com';
        },
    },
    {
        type: 'input',
        name: 'admin_user',
        message: 'Admin Username',
        default: function () {
            return 'admin';
        },
    },
    {
        type: 'input',
        name: 'admin_password',
        message: 'Admin Password',
        default: function () {
            return 'admin123';
        },
    },
    {
        type: 'input',
        name: 'backend_frontname',
        message: 'Backend Frontname',
        default: function () {
            return 'admin';
        },
    }
]).then(answers => {
    const command = install_command(answers);
    console.log(command);
    const execProcess = exec(command);

    execProcess.stdout.on('data', function (data) {
        console.log(data);
    });
    execProcess.stderr.on('data', function (data) {
        console.log(data);
    });
});