import { Vector3 } from "./Vector3";
import { Illumination } from "./Illumination";

export enum ShadingType {
    Phong,
    Gouraud,
    Flat
}

interface Shading {
    currentY: number;
    lightPosition: Vector3;
}

export interface GouraudShading extends Shading {
    Ia: number;
    Ib: number;
    Ic: number;
    Id: number;
}

export interface PhongShading extends Shading {
    cameraPosition: Vector3;
    illumination: Illumination;
}

export interface FlatShading extends Shading {
    I: number;
}
