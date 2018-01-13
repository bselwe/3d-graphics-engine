import { container } from "./inversify.config";
import { injectable } from "inversify";
import * as TSM from "@richlewis42/tsm";

@injectable()
export class Application {
    constructor() {
    }

    public async init() {
    }
}
