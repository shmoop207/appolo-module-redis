"use strict";
import {define, inject, singleton} from '@appolo/inject'
import {IOptions, IScript} from "../IOptions";
import {Promises} from "@appolo/utils";
import Redis = require("ioredis");
import path = require("path");
import fs = require("fs");
import {RedisClientFactory} from "./redisClientFactory";

@define()
@singleton()
export class ScriptsManager {

    @inject() protected moduleOptions: IOptions;

    private readonly Scripts: IScript[] = [{
        name: "get_by_expire", path: path.resolve(__dirname, "../lua/getByExpire.lua"), args: 1
    }, {
        name: "lock", path: path.resolve(__dirname, "../lua/lock.lua"), args: 1
    }];

    public async load(clients: Redis.Redis[]) {

        let scripts = (this.moduleOptions.scripts || []).concat(this.Scripts);

        await Promises.map(scripts, async script => {

            if (!script.lua && !script.path) {
                throw new Error(`path or lua must be defined for script name ${name}`);
            }

            let lua = script.lua;

            if (!lua) {
                lua = await this._loadPath(script.path)
            }

            this._defineCommand(clients, script, lua)
        });

    }

    private _defineCommand(clients: Redis.Redis[], script: IScript, lua: string) {
        for (let i = 0; i < clients.length; i++) {
            let client = clients[i];

            if (client[script.name]) {
                continue;
            }

            client.defineCommand(script.name, {
                numberOfKeys: script.args,
                lua: lua
            });
        }

    }

    private _loadPath(file: string): PromiseLike<string> {
        return Promises.fromCallback<string>(c => fs.readFile(path.resolve(process.cwd(), file), {encoding: "utf8"}, c));
    }

}
