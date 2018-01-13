import { Vector3 } from "../Models/Vector3";


export class Mesh {
    name: string;
    position: Vector3;
    rotation: Vector3;
    vertices: Vector3[];

    constructor(name: string) {
        this.name = name;
        this.vertices = [];
        this.position = Vector3.ZERO;
        this.rotation = Vector3.ZERO;
    }
}
