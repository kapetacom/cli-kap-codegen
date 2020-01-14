#!/usr/bin/env node

const BlockwareCommand = require('@blockware/blockctl-command');
const ClusterConfiguration = require('@blockware/local-cluster-config');
const {registry:Targets} = require('@blockware/codegen');
const packageData = require('./package');

const providerDir = ClusterConfiguration.getProvidersBasedir();

Targets.load(providerDir);

const command = new BlockwareCommand('codegen', packageData.version);
command.program()
    .command('generate <path>')
    .action(require('./actions/generate'));

command.start();