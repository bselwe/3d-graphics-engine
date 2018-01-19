import { Vector3 } from "./Vector3";
import { Illumination, Light } from "./Illumination";

export enum ShadingType {
    Phong,
    Gouraud,
    Flat
}

interface Shading {
    currentY: number;
}

export interface GouraudShading extends Shading {
    Ia: number;
    Ib: number;
    Ic: number;
    Id: number;
}

export interface PhongShading extends Shading {
    cameraPosition: Vector3;
    lights: Light[];
    illumination: Illumination;
}

export interface FlatShading extends Shading {
    I: number;
}
