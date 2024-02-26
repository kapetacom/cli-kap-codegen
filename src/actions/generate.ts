/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import * as FS from 'fs';
import * as Path from 'path';
import { BlockCodeGenerator, CodeWriter } from '@kapeta/codegen';
import { parseKapetaUri } from '@kapeta/nodejs-utils';
import glob from 'glob';
import { BlockDefinition } from '@kapeta/schemas';
import {parseAllDocuments, Document as YAMLDocument} from 'yaml';
import ClusterConfiguration from '@kapeta/local-cluster-config';


const CORE_PREFIX = 'core/';

export interface KapetaYMLFiles {
    filename: string;
    contents:  BlockDefinition[];
}

export interface KapetaYMLFile {
    filename: string;
    contents:  BlockDefinition;
}

function readYamlFile(file: string): KapetaYMLFiles {
    const content = parseAllDocuments(FS.readFileSync(file).toString());
    const blocks = content.map((doc: YAMLDocument) => {
        return doc.toJSON() as BlockDefinition;
    })
    return {
        filename: file,
        contents: blocks,
    };
}

export function blockYamlFilter(yaml: KapetaYMLFiles): KapetaYMLFile[] {
    const result = yaml.contents.flatMap((doc: BlockDefinition) => {
        if (doc && doc.kind && !doc.kind.toLowerCase().startsWith(CORE_PREFIX)) {
            return { filename: yaml.filename, contents: doc };
        }
        return [];
    }
    );
    return result;
}

export async function generate(path: string) {
    path = Path.resolve(process.cwd(), path);

    if (!FS.existsSync(path)) {
        console.error("Path doesn't exist:", path);
        return;
    }

    const pathStat = FS.statSync(path);

    let files = [];

    if (pathStat.isFile()) {
        if (path.toLowerCase().endsWith('.yml') || path.toLowerCase().endsWith('.yaml')) {
            files = [path];
        } else {
            console.error('File must be a YAML file (.yml|.yaml)');
            return;
        }
    } else {
        files = glob.sync('**/*.y?(a)ml', { cwd: path, realpath: true });
    }

    const kapFile = files.map(readYamlFile)
    const blocks = kapFile.flatMap(blockYamlFilter);
    const definitions = ClusterConfiguration.getDefinitions();
    console.log('Generating code for %d blocks', blocks.length)
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (i > 0) {
            console.log('\n----');
        }
        try {
            const baseDir = Path.dirname(block.filename);

            const kindUri = parseKapetaUri(block.contents.kind);

            const providerDefinition = definitions.find((d: any) =>
                parseKapetaUri(d.definition.metadata.name + ':' + d.version).equals(kindUri)
            );

            if (!providerDefinition) {
                console.log('Block type is missing: %s', block.contents.kind);
                continue;
            }

            const hasTarget = !!providerDefinition.definition.spec.schema?.properties?.target;

            if (!hasTarget) {
                console.log(
                    'Block type does not require code generation for %s in %s',
                    Path.basename(block.filename),
                    baseDir
                );
                console.log(' - Kind: %s', block.contents.kind);
                console.log('No code was generated for block: %s\n\n', block.filename);
                continue;
            }

            const requiresTarget = providerDefinition.definition.spec.schema?.required
                ? providerDefinition.definition.spec.schema?.required.includes('target')
                : false;

            if (!requiresTarget && !block.contents.spec?.target?.kind) {
                console.log('Block type has no target specified for %s in %s', Path.basename(block.filename), baseDir);
                console.log(' - Kind: %s', block.contents.kind);
                console.log('No code was generated for block: %s\n\n', block.filename);
                continue;
            }

            console.log('Generating code for %s in %s', Path.basename(block.filename), baseDir);
            console.log(' - Kind: %s', block.contents.kind);

            const codeGenerator = new BlockCodeGenerator(block.contents);

            const output = await codeGenerator.generate();

            const writer = new CodeWriter(baseDir);

            const changedFiles = writer.write(output);

            await codeGenerator.postprocess(baseDir, changedFiles);

            console.log('Code was generated for block: %s\n\n', block.filename);
        } catch (err: any) {
            console.error('Failed to generate code for block: ', block.filename, err.stack);
        }
    }
};

//module.exports = generate;