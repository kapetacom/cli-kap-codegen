#!/usr/bin/env node

const KapetaCommand = require('@kapeta/blockctl-command');
const ClusterConfiguration = require('@kapeta/local-cluster-config');
const {registry:Targets} = require('@kapeta/codegen');
const packageData = require('./package');

const TARGET_KIND = 'core/language-target';
const languageTargets = ClusterConfiguration.getProviderDefinitions(TARGET_KIND);
languageTargets.forEach((languageTarget) => {
    const key = `${languageTarget.definition.metadata.name}:${languageTarget.version}`;
    Targets.register(key, require(languageTarget.path));
});


const command = new KapetaCommand('codegen', packageData.version);
command.program()
    .command('generate <path>')
    .action(require('./actions/generate'));

command.start();
