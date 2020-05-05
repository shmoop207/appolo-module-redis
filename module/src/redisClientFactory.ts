import {define, inject, singleton} from "appolo/index";
import {IOptions, IScript} from "../IOptions";
import Redis = require("ioredis");

@define()
@singleton()
export class RedisClientFactory {
    @inject() protected moduleOptions: IOptions;

    @inject() protected redisClients: Redis.Redis[]

    public getClient() {
        let client = this.redisClients[0];
        for (let i = 0; i < this.redisClients.length; i++) {
            if (this.redisClients[i].status === "ready") {
                return this.redisClients[i];
            }
        }

        return client;
    }


}
