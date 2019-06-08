#!/usr/bin/env node

const BlockwareCommand = require('@blockware/blockctl-command');
const packageData = require('./package');
const {registry:Targets} = require('@blockware/codegen');

//Hardcoded for now
Targets.register('targets.blockware.com/v1/java8-springboot2',
    require('@blockware/codegen-target-java8-springboot2'));

Targets.register('targets.blockware.com/v1/nodejs9',
    require('@blockware/codegen-target-nodejs9'));

const command = new BlockwareCommand('codegen', packageData.version);
command.program()
    .command('generate <path>')
    .action(require('./actions/generate'));

command.start();