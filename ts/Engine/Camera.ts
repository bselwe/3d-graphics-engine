import { Vector3 } from "../Models/Vector3";

export class Camera {
    position: Vector3;
    target: Vector3;

    constructor() {
        this.position = Vector3.ZERO;
        this.target = Vector3.ZERO;
    }
}
