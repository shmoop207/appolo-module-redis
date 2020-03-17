"use strict";
import {define, inject, singleton} from 'appolo'
import {IOptions, IScript} from "../IOptions";
import Redis = require("ioredis");
import Q = require("bluebird");
import path = require("path");
import fs = require("fs");
import {RedisClientFactory} from "./redisClientFactory";

@define()
@singleton()
export class ScriptsManager {

    @inject() protected redisClientFactory: RedisClientFactory;
    @inject() protected moduleOptions: IOptions;

    private readonly Scripts: IScript[] = [{
        name: "get_by_expire", path: path.resolve(__dirname, "../lua/getByExpire.lua"), args: 1
    }, {
        name: "lock", path: path.resolve(__dirname, "../lua/lock.lua"), args: 1
    }];

    public async load() {

        let scripts = (this.moduleOptions.scripts || []).concat(this.Scripts);

        await Q.map(scripts, async script => {

            if (!script.lua && !script.path) {
                throw new Error(`path or lua must be defined for script name ${name}`);
            }

            let lua = script.lua;

            if (!lua) {
                lua = await this._loadPath(script.path)
            }

            this.redisClientFactory.defineCommand(script, lua)
        });

    }

    private _loadPath(file: string): PromiseLike<string> {
        return Q.fromCallback<string>(c => fs.readFile(path.resolve(process.cwd(), file), {encoding: "utf8"}, c));
    }

}
