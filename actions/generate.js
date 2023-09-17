const FS = require('fs');
const Path = require('path');
const { BlockCodeGenerator, CodeWriter } = require('@kapeta/codegen');
const { parseKapetaUri } = require('@kapeta/nodejs-utils');
const glob = require('glob');
const YAML = require('yaml');
const ClusterConfiguration = require('@kapeta/local-cluster-config').default;

const CORE_PREFIX = 'core/';

function readYamlFile(file) {
    const content = YAML.parse(FS.readFileSync(file).toString());
    return {
        filename: file,
        content,
    };
}

function blockYamlFilter(yaml) {
    if (!yaml.content || !yaml.content.kind) {
        return false;
    }

    return !yaml.content.kind.toLowerCase().startsWith(CORE_PREFIX);
}

module.exports = async function (path) {
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

    const blocks = files.map(readYamlFile).filter(blockYamlFilter);
    const definitions = ClusterConfiguration.getDefinitions();

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (i > 0) {
            console.log('\n----');
        }
        try {
            const baseDir = Path.dirname(block.filename);

            const kindUri = parseKapetaUri(block.content.kind);

            const providerDefinition = definitions.find((d) =>
                parseKapetaUri(d.definition.metadata.name + ':' + d.version).equals(kindUri)
            );

            if (!providerDefinition) {
                console.log('Block type is missing: %s', block.content.kind);
                continue;
            }

            const hasTarget = !!providerDefinition.definition.spec.schema?.properties?.target;

            if (!hasTarget) {
                console.log(
                    'Block type does not require code generation for %s in %s',
                    Path.basename(block.filename),
                    baseDir
                );
                console.log(' - Kind: %s', block.content.kind);
                console.log('No code was generated for block: %s\n\n', block.filename);
                continue;
            }

            const requiresTarget = providerDefinition.definition.spec.schema?.required
                ? providerDefinition.definition.spec.schema?.required.includes('target')
                : false;

            if (!requiresTarget && !block.content.spec?.target?.kind) {
                console.log('Block type has no target specified for %s in %s', Path.basename(block.filename), baseDir);
                console.log(' - Kind: %s', block.content.kind);
                console.log('No code was generated for block: %s\n\n', block.filename);
                continue;
            }

            console.log('Generating code for %s in %s', Path.basename(block.filename), baseDir);
            console.log(' - Kind: %s', block.content.kind);

            const codeGenerator = new BlockCodeGenerator(block.content);

            const output = await codeGenerator.generate();

            const writer = new CodeWriter(baseDir);

            const changedFiles = writer.write(output);

            await codeGenerator.postprocess(baseDir, changedFiles);

            console.log('Code was generated for block: %s\n\n', block.filename);
        } catch (err) {
            console.error('Failed to generate code for block: ', block.filename, err.stack);
        }
    }
};
