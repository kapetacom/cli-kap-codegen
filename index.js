#!/usr/bin/env node

const BlockwareCommand = require('@blockware/blockctl-command');
const ClusterConfiguration = require('@blockware/local-cluster-config');
const {registry:Targets} = require('@blockware/codegen');
const packageData = require('./package');

const TARGET_KIND = 'core/language-target';
const languageTargets = ClusterConfiguration.getProviderDefinitions(TARGET_KIND);
languageTargets.forEach((languageTarget) => {
    Targets.register(languageTarget.definition.metadata.name, require(languageTarget.path));
});


const command = new BlockwareCommand('codegen', packageData.version);
command.program()
    .command('generate <path>')
    .action(require('./actions/generate'));

command.start();