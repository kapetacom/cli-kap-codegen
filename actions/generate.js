const FS = require('fs');
const Path = require('path');
const {BlockCodeGenerator, CodeWriter} = require('@kapeta/codegen');
const glob = require('glob');
const YAML = require('yaml');

const BW_PREFIX = 'kapeta/block-type-';

function readYamlFile(file) {
    const content = YAML.parse(FS.readFileSync(file).toString());
    return {
        filename: file,
        content
    };
}

function blockYamlFilter(yaml) {
    if (!yaml.content ||
        !yaml.content.kind) {
        return false;
    }

    return yaml.content.kind.toLowerCase().startsWith(BW_PREFIX);
}

module.exports = async function(path) {
    path = Path.resolve(process.cwd(), path);

    if (!FS.existsSync(path)) {
        console.error('Path doesn\'t exist:', path);
        return;
    }

    const pathStat = FS.statSync(path);

    let files = [];

    if (pathStat.isFile()) {
        if (path.toLowerCase().endsWith('.yml') ||
            path.toLowerCase().endsWith('.yaml')) {
            files = [path];
        } else {
            console.error('File must be a YAML file (.yml|.yaml)');
            return;
        }

    } else {
        files = glob.sync('**/*.y?(a)ml', {cwd: path, realpath: true});
    }

    const blocks = files.map(readYamlFile).filter(blockYamlFilter);

    for(let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        try {
            const baseDir = Path.dirname(block.filename);

            console.log('\n----\nGenerating code for %s in %s', Path.basename(block.filename), baseDir);
            console.log(' - Kind: %s',block.content.kind);

            const codeGenerator = new BlockCodeGenerator(block.content);

            const output = await codeGenerator.generate();

            const writer = new CodeWriter(baseDir);

            const changedFiles = writer.write(output);

            await codeGenerator.postprocess(baseDir, changedFiles);

            console.log('Code was generated for block: %s\n\n', block.filename);
        } catch(err) {
            console.error('Failed to generate code for block: ', block.filename, err.stack);
        }
    }

};
