import { EventEmitter } from "eventemitter3";
import { injectable } from "inversify";

@injectable()
export class KeyTracker extends EventEmitter {
    public keys: { [key: number]: boolean } = {};

    constructor() {
        super();

        window.addEventListener("keydown", event => this.onKeyDown(event.keyCode));
        window.addEventListener("keyup", event => this.onKeyUp(event.keyCode));
    }

    private onKeyDown(key: number) {
        this.keys[key] = true;
    }

    private onKeyUp(key: number) {
        this.keys[key] = false;
    }
}

export enum Key {
    W = 87, S = 83, A = 65, D = 68,
    UP = 38, DOWN = 40, LEFT = 37, RIGHT = 39,
    LBRACKET = 219, RBRACKET = 221
}
