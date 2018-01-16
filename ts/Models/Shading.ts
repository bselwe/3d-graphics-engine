import { Vector3 } from "./Vector3";

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
    ndotla: number;
    ndotlb: number;
    ndotlc: number;
    ndotld: number;
}

export interface PhongShading extends Shading {
    cameraPosition: Vector3;
}

export interface FlatShading extends Shading {
    ndotl: number;
}
