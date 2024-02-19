import {define, inject, singleton} from "@appolo/inject";
import {Arrays, Hash} from "@appolo/utils";
import {IOptions, IScript} from "../IOptions";
import Redis = require("ioredis");

@define()
@singleton()
export class RedisClientFactory {
    @inject() protected moduleOptions: IOptions;

    @inject() protected redisClients: Redis.Redis[]

    public getClient(): Redis.Redis {

        if (this.redisClients.length === 1) {
            return this.redisClients[0];
        }

        let client = this.redisClients.find(client => client.status === "ready");

        return client || this.redisClients[0];
    }

    public getClientRandom(): Redis.Redis {
        let clients = this.redisClients;

        return Arrays.random(clients)
    }

    public getClientHash(key: string): Redis.Redis {
        let clients = this.redisClients;

        let index = Hash.strNumHash(key) % clients.length

        return clients[index] || clients[0];
    }

    public getAllClients(): Redis.Redis[] {
        return this.redisClients.slice(0);
    }

    public getReadyClients(): Redis.Redis[] {
        return this.redisClients.filter(client => client.status === "ready");
    }


}
