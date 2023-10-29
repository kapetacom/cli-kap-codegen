#!/usr/bin/env node
/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */


const KapetaCommand = require('@kapeta/kap-command');
const ClusterConfiguration = require('@kapeta/local-cluster-config').default;
const { registry: Targets } = require('@kapeta/codegen');
const packageData = require('./package');

const TARGET_KIND = 'core/language-target';
const languageTargets = ClusterConfiguration.getProviderDefinitions(TARGET_KIND);
languageTargets.forEach((languageTarget) => {
    const key = `${languageTarget.definition.metadata.name}:${languageTarget.version}`;

    try {
        const target = require(languageTarget.path);
        if (target.default) {
            Targets.register(key, target.default);
        } else {
            Targets.register(key, target);
        }
    } catch (e) {
        console.warn('Failed to load language target @ %s', languageTarget.path, e);
    }
});

const command = new KapetaCommand('codegen', packageData.version);
command.program().command('generate <path>').action(require('./actions/generate'));

command.start();
