import {bootstrap, define, IBootstrap, inject} from 'appolo'
import {ScriptsManager} from "./scriptsManager";
import {RedisClientFactory} from "./redisClientFactory";

@define()
@bootstrap()
export class Bootstrap implements IBootstrap {

    @inject() scriptsManager: ScriptsManager;
    @inject() redisClientFactory: RedisClientFactory;

    async run() {
        await this.redisClientFactory.initialize();
        await this.scriptsManager.load();
    }
}
