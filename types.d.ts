/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
*/
declare module '@kapeta/kap-command' {
    export class KapetaCommand {
        constructor(name: string, version: any);
        program(): any;
        start(): void;
    }
}