import {define, inject, singleton} from "appolo/index";
import {IOptions, IScript} from "../IOptions";
import Redis = require("ioredis");
import {RedisClientCreator} from "./redisClientCreator";

@define()
@singleton()
export class RedisClientFactory {
    @inject() protected moduleOptions: IOptions;
    @inject() private redisClientCreator: RedisClientCreator;

    private _clients: Redis.Redis[] = [];

    public async initialize() {

        let fallback = this.moduleOptions.fallbackConnections;

        let connections = [this.moduleOptions.connection]
            .concat(fallback && Array.isArray(fallback) ? fallback : []);

        await Promise.all(connections.map(conn => this._createConnection(conn)))
    }

    private async _createConnection(connection: string) {
        let client = await this.redisClientCreator.create(connection);
        this._clients.push(client);
    }

    public getClient() {
        let client = this._clients[0];
        for (let i = 0; i < this._clients.length; i++) {
            if (this._clients[i].status === "ready") {
                return this._clients[i];
            }
        }

        return client;
    }

    public defineCommand(script: IScript, lua: string) {
        for (let i = 0; i < this._clients.length; i++) {
            let client = this._clients[i];

            if (client[script.name]) {
                continue;
            }

            client.defineCommand(script.name, {
                numberOfKeys: script.args,
                lua: lua
            });
        }

    }


}
