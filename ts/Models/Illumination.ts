import { Vector3 } from "./Vector3";

export enum Illumination {
    Phong,
    Blinn
}

export interface Light {
    position: Vector3;
}

export interface Reflector extends Light {
    target: Vector3;
}
