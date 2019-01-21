import {bootstrap, define, IBootstrap, inject} from 'appolo'
import {ScriptsManager} from "./scriptsManager";

@define()
@bootstrap()
export class Bootstrap implements IBootstrap {

    @inject() scriptsManager: ScriptsManager;

    async run() {
        await this.scriptsManager.load();
    }
}