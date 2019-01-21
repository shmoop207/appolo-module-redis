import {module, Module} from "appolo/index";
import {IOptions} from "./IOptions";
import {RedisProvider} from "./src/redisProvider";

@module()
export class RedisModule extends Module<IOptions> {

    constructor(options?: IOptions) {
        super(options)
    }

    protected readonly Defaults: Partial<IOptions> = {id: "redisProvider"};

    public get exports() {
        return [{id: this.moduleOptions.id, type: RedisProvider}];
    }

}