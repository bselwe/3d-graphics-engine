import { matrix, multiply } from "mathjs";
import { Color } from "../Models/Color";
import { Camera } from "./Camera";
import { Mesh, Vertex } from "./Mesh";
import { Vector3 } from "../Models/Vector3";
import { Vector2 } from "../Models/Vector2";
import { Transformations } from "./Transformations";

export enum Shading {
    Phong,
    Gouraud
}

interface PhongData {
    currentY: number;
    lightPosition: Vector3;
}

interface GouraudData {
    currentY: number;
    ndotla: number;
    ndotlb: number;
    ndotlc: number;
    ndotld: number;
}

export class Device {
    private readonly maxDepth = 10000000;

    private backBuffer: ImageData;
    private depthBuffer: number[];
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.width = canvas.width;
        this.height = canvas.height;
        this.depthBuffer = new Array(this.width * this.height);
    }

    public clear() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.backBuffer = this.context.getImageData(0, 0, this.width, this.height);
        this.depthBuffer.fill(this.maxDepth);
    }

    public render(camera: Camera, meshes: Mesh[], lightPosition: Vector3, shading: Shading = Shading.Gouraud) {
        let viewMatrix = Transformations.lookAt(camera.position, camera.target, Vector3.DOWN);
        let projectionMatrix = Transformations.perspective();

        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];

            let scale = Transformations.scale(1, 1, 1);
            let rotation = Transformations.rotate(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
            let translation = Transformations.translate(mesh.position.x, mesh.position.y, mesh.position.z);

            let worldMatrix = multiply(translation, multiply(rotation, scale));
            let transformMatrix = multiply(projectionMatrix, multiply(worldMatrix, viewMatrix));

            for (let j = 0; j < mesh.faces.length; j++) {
                let face = mesh.faces[j];
                let vertexA = mesh.vertices[face.A];
                let vertexB = mesh.vertices[face.B];
                let vertexC = mesh.vertices[face.C];

                let pixelA = this.projectCoordinates(vertexA, transformMatrix, worldMatrix);
                let pixelB = this.projectCoordinates(vertexB, transformMatrix, worldMatrix);
                let pixelC = this.projectCoordinates(vertexC, transformMatrix, worldMatrix);

                let color = 255;
                this.drawTriangle(pixelA, pixelB, pixelC, new Color(color, color, color, 255), lightPosition, shading);
            }
        }

        this.context.putImageData(this.backBuffer, 0, 0);
    }

    // Transform 3D coordinates to 2D coordinates using transformation matrix
    private projectCoordinates(vertex: Vertex, transformMatrix: mathjs.Matrix, worldMatrix: mathjs.Matrix): Vertex {
        let point2D = this.transformCoordinates(vertex.coordinates, transformMatrix);
        let point3DWorld = this.transformCoordinates(vertex.coordinates, worldMatrix);
        let normal3DWorld = this.transformCoordinates(vertex.normal, worldMatrix);

        point2D.x = (point2D.x + 1) / 2 * this.width;
        point2D.y = (point2D.y + 1) / 2 * this.height;

        return {
            normal: normal3DWorld,
            coordinates: point2D,
            worldCoordinates: point3DWorld
        };
    }

    private transformCoordinates(vector: Vector3, transformMatrix: mathjs.Matrix): Vector3 {
        let x = (vector.x * transformMatrix.get([0, 0])) + (vector.y * transformMatrix.get([0, 1])) + (vector.z * transformMatrix.get([0, 2])) + transformMatrix.get([0, 3]);
        let y = (vector.x * transformMatrix.get([1, 0])) + (vector.y * transformMatrix.get([1, 1])) + (vector.z * transformMatrix.get([1, 2])) + transformMatrix.get([1, 3]);
        let z = (vector.x * transformMatrix.get([2, 0])) + (vector.y * transformMatrix.get([2, 1])) + (vector.z * transformMatrix.get([2, 2])) + transformMatrix.get([2, 3]);
        let w = (vector.x * transformMatrix.get([3, 0])) + (vector.y * transformMatrix.get([3, 1])) + (vector.z * transformMatrix.get([3, 2])) + transformMatrix.get([3, 3]);
        return new Vector3(x / w, y / w, z / w);

        // let vectorCoordinates = [...vector.array, 1];
        // let result = multiply(transformMatrix, vectorCoordinates);

        // let x = result.get([0]);
        // let y = result.get([1]);
        // let z = result.get([2]);
        // let w = result.get([3]);

        // return new Vector3(x / w, y / w, z / w);
    }

    private drawPoint(point: Vector3, color: Color) {
        if (point.x >= 0 && point.y >= 0 && point.x <= this.width && point.y <= this.height) {
            this.putPixel(point.x, point.y, point.z, color);
        }
    }

    private putPixel(x: number, y: number, z: number, color: Color) {
        let bufferData = this.backBuffer.data;
        let pixelIndex = (x >> 0) + (y >> 0) * this.width;
        let colorIndex = pixelIndex * 4;

        if (this.depthBuffer[pixelIndex] < z) {
            return;
        }

        this.depthBuffer[pixelIndex] = z;
        bufferData[colorIndex] = color.r;
        bufferData[colorIndex + 1] = color.g;
        bufferData[colorIndex + 2] = color.b;
        bufferData[colorIndex + 3] = color.a;
    }

    private clamp(value: number, min: number = 0, max: number = 1) {
        return Math.max(min, Math.min(value, max));
    }

    // min - starting point
    // max - ending point
    // gradient - % between the 2 points
    private interpolate(min: number, max: number, gradient: number) {
        return min + (max - min) * this.clamp(gradient);
    }

    private interpolateVector(min: Vector3, max: Vector3, gradient: number) {
        let x = this.interpolate(min.x, max.x, gradient);
        let y = this.interpolate(min.y, max.y, gradient);
        let z = this.interpolate(min.z, max.z, gradient);
        return new Vector3(x, y, z);
    }

    // Gourard shading - the color of each vertex is computed and then interpolated across the surface
    // Draw line between 2 points from left to right, ab -> cd, points must be sorted
    private processScanLineGouraud(data: GouraudData, va: Vertex, vb: Vertex, vc: Vertex, vd: Vertex, color: Color) {
        let pa = va.coordinates;
        let pb = vb.coordinates;
        let pc = vc.coordinates;
        let pd = vd.coordinates;

        let gradient1 = pa.y !== pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
        let gradient2 = pc.y !== pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

        let sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        let ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // Interpolating the color
        let snl = this.interpolate(data.ndotla, data.ndotlb, gradient1);
        let enl = this.interpolate(data.ndotlc, data.ndotld, gradient2);

        // Z-buffer
        let z1 = this.interpolate(pa.z, pb.z, gradient1);
        let z2 = this.interpolate(pc.z, pd.z, gradient2);

        for (let x = sx; x < ex; x++) {
            let gradient = (x - sx) / (ex - sx);
            let z = this.interpolate(z1, z2, gradient);
            let ndotl = this.interpolate(snl, enl, gradient);

            this.drawPoint(new Vector3(x, data.currentY, z), new Color(color.r * ndotl, color.g * ndotl, color.b * ndotl, 255));
        }
    }

    // Phong shading - interpolating the vectors across the surface and computing the color for each point of interest
    // Draw line between 2 points from left to right, ab -> cd, points must be sorted
    private processScanLinePhong(data: PhongData, va: Vertex, vb: Vertex, vc: Vertex, vd: Vertex, color: Color) {
        let pa = va.coordinates;
        let pb = vb.coordinates;
        let pc = vc.coordinates;
        let pd = vd.coordinates;

        let gradient1 = pa.y !== pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
        let gradient2 = pc.y !== pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

        let sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        let ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // Interpolating normal vectors and world coordinates
        let sn = this.interpolateVector(va.normal, vb.normal, gradient1);
        let en = this.interpolateVector(vc.normal, vd.normal, gradient2);
        let swx = this.interpolateVector(va.worldCoordinates, vb.worldCoordinates, gradient1);
        let ewx = this.interpolateVector(vc.worldCoordinates, vd.worldCoordinates, gradient2);

        // Z-buffer
        let z1 = this.interpolate(pa.z, pb.z, gradient1);
        let z2 = this.interpolate(pc.z, pd.z, gradient2);

        for (let x = sx; x < ex; x++) {
            let gradient = (x - sx) / (ex - sx);
            let z = this.interpolate(z1, z2, gradient);
            let n = this.interpolateVector(sn, en, gradient);
            let w = this.interpolateVector(swx, ewx, gradient);
            let ndotl = this.computeNDotL(w, n, data.lightPosition);

            this.drawPoint(new Vector3(x, data.currentY, z), new Color(color.r * ndotl, color.g * ndotl, color.b * ndotl, 255));
        }
    }

    private computeNDotL(vertex: Vector3, normal: Vector3, lightPosition: Vector3) {
        let lightDirection = Vector3.difference(lightPosition, vertex).normalize();
        return Math.max(0, Vector3.dot(normal, lightDirection));
    }

    private drawTriangle(v1: Vertex, v2: Vertex, v3: Vertex, color: Color, lightPosition: Vector3, shading: Shading) {
        [v1, v2, v3] = [v1, v2, v3].sort((v1, v2) => v1.coordinates.y < v2.coordinates.y ? -1 : 1);

        let p1 = v1.coordinates;
        let p2 = v2.coordinates;
        let p3 = v3.coordinates;

        // // Flat shading - single normal vector; shading for the entire triangle
        // let vnFace = (v1.normal.add(v2.normal.add(v3.normal))).scale(1 / 3);
        // let centerPoint = (v1.worldCoordinates.add(v2.worldCoordinates.add(v3.worldCoordinates))).scale(1 / 3);
        // let ndotl = this.computeNDotL(centerPoint, vnFace, lightPosition);

        // Gouraud
        let nl1 = this.computeNDotL(v1.worldCoordinates, v1.normal, lightPosition);
        let nl2 = this.computeNDotL(v2.worldCoordinates, v2.normal, lightPosition);
        let nl3 = this.computeNDotL(v3.worldCoordinates, v3.normal, lightPosition);

        // Slopes
        let dP1P2 = p2.y - p1.y > 0 ? (p2.x - p1.x) / (p2.y - p1.y) : 0;
        let dP1P3 = p3.y - p1.y > 0 ? (p3.x - p1.x) / (p3.y - p1.y) : 0;

        // P3 on the left
        if (dP1P2 > dP1P3) {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (shading === Shading.Gouraud) {
                    if (y < p2.y) {
                        let data: GouraudData = { currentY: y, ndotla: nl1, ndotlb: nl3, ndotlc: nl1, ndotld: nl2 };
                        this.processScanLineGouraud(data, v1, v3, v1, v2, color);
                    } else {
                        let data: GouraudData = { currentY: y, ndotla: nl1, ndotlb: nl3, ndotlc: nl2, ndotld: nl3 };
                        this.processScanLineGouraud(data, v1, v3, v2, v3, color);
                    }
                } else {
                    let data: PhongData = { currentY: y, lightPosition };
                    if (y < p2.y) {
                        this.processScanLinePhong(data, v1, v3, v1, v2, color);
                    } else {
                        this.processScanLinePhong(data, v1, v3, v2, v3, color);
                    }
                }
            }
        // P2 on the left
        } else {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (shading === Shading.Gouraud) {
                    if (y < p2.y) {
                        let data: GouraudData = { currentY: y, ndotla: nl1, ndotlb: nl2, ndotlc: nl1, ndotld: nl3 };
                        this.processScanLineGouraud(data, v1, v2, v1, v3, color);
                    } else {
                        let data: GouraudData = { currentY: y, ndotla: nl2, ndotlb: nl3, ndotlc: nl1, ndotld: nl3 };
                        this.processScanLineGouraud(data, v2, v3, v1, v3, color);
                    }
                } else {
                    let data: PhongData = { currentY: y, lightPosition };
                    if (y < p2.y) {
                        this.processScanLinePhong(data, v1, v2, v1, v3, color);
                    } else {
                        this.processScanLinePhong(data, v2, v3, v1, v3, color);
                    }
                }
            }
        }
    }
}
