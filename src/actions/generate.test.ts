/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
*/

import * as assert from 'assert';
import { KapetaYMLFiles, blockYamlFilter } from './generate';

describe('blockYamlFilter', () => {
    it('should return an empty array for a YAML file that does not contain a block', () => {
        const yaml = {
            filename: 'test.yaml',
            contents: [],
        };
        const blocks = blockYamlFilter(yaml);
        assert.ok(blocks.length === 0);
    });

    it('should return an array containing a block for a YAML file that contains a block', () => {
        const yaml: KapetaYMLFiles = {
            filename: 'test.yml',
            contents: [
                {
                    kind: 'test/block',
                    metadata: {
                        name: 'my-block',
                    },
                    spec: {},
                }
            ],
        };
        const blocks = blockYamlFilter(yaml);
        assert.equal(blocks.length, 1);
        assert.equal(blocks[0].filename, 'test.yml');
        assert.equal(blocks[0].contents.kind, 'test/block');
    });

    it('should return an array containing a block for a YAML file that contains multiple blocks', () => {
        const yaml: KapetaYMLFiles = {
            filename: 'test.yml',
            contents: [
                {
                    kind: 'test/block',
                    metadata: {
                        name: 'my-block',
                    },
                    spec: {},
                },
                {
                    kind: 'test/block1',
                    metadata: {
                        name: 'my-block2',
                    },
                    spec: {},
                },
            ],
        };
        const blocks = blockYamlFilter(yaml);
        assert.equal(blocks.length, 2);
        assert.ok(blocks[0].filename === 'test.yml');
        assert.ok(blocks[0].contents.kind === 'test/block');
        assert.ok(blocks[1].filename === 'test.yml');
        assert.ok(blocks[1].contents.kind === 'test/block1');
    });

    it('should filter out blocks with core prefix', () => {
        const yaml: KapetaYMLFiles = {
            filename: 'test.yml',
            contents: [
                {
                    kind: 'core/block',
                    metadata: {
                        name: 'my-block',
                    },
                    spec: {},
                },
                {
                    kind: 'test/block1',
                    metadata: {
                        name: 'my-block2',
                    },
                    spec: {},
                },
            ],
        };
        const blocks = blockYamlFilter(yaml);
        assert.equal(blocks.length, 1);
    });
});