#!/usr/bin/env node
/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
*/
import {DefinitionInfo} from "@kapeta/local-cluster-config";
import { registry as Targets } from '@kapeta/codegen';
const KapetaCommand = require('@kapeta/kap-command');
const ClusterConfiguration = require('@kapeta/local-cluster-config').default;

const TARGET_KIND = 'core/language-target';
const languageTargets = ClusterConfiguration.getProviderDefinitions(TARGET_KIND);

import {generate as generateAction} from './actions/generate';
languageTargets.forEach((languageTarget: DefinitionInfo) => {
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
const version = process.env.npm_package_version
const command = new KapetaCommand('codegen', version);
command.program().command('generate <path>').action(generateAction);

command.start();
