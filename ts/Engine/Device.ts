import { matrix, multiply } from "mathjs";
import { Color } from "../Models/Color";
import { Camera } from "./Camera";
import { Mesh, Vertex } from "./Mesh";
import { Vector3 } from "../Models/Vector3";
import { Vector2 } from "../Models/Vector2";
import { Transformations } from "./Transformations";
import { ShadingType, GouraudShading, PhongShading, FlatShading } from "../Models/Shading";
import { Illumination, Light, Reflector } from "./../Models/Illumination";

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

    public render(camera: Camera, meshes: Mesh[], lights: Light[], shading: ShadingType = ShadingType.Gouraud, illumination: Illumination = Illumination.Blinn) {
        let viewMatrix = Transformations.lookAt(camera.position, camera.target, Vector3.DOWN);
        let projectionMatrix = Transformations.perspective();

        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];

            let scale = Transformations.scale(1, 1, 1);
            let rotation = Transformations.rotate(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
            let translation = Transformations.translate(mesh.position.x, mesh.position.y, mesh.position.z);

            let worldMatrix = multiply(translation, multiply(rotation, scale));
            let transformMatrix = multiply(projectionMatrix, multiply(viewMatrix, worldMatrix));

            for (let j = 0; j < mesh.faces.length; j++) {
                let face = mesh.faces[j];
                let vertexA = mesh.vertices[face.A];
                let vertexB = mesh.vertices[face.B];
                let vertexC = mesh.vertices[face.C];

                let pixelA = this.projectCoordinates(vertexA, transformMatrix, worldMatrix);
                let pixelB = this.projectCoordinates(vertexB, transformMatrix, worldMatrix);
                let pixelC = this.projectCoordinates(vertexC, transformMatrix, worldMatrix);

                this.drawTriangle(pixelA, pixelB, pixelC, lights, camera.position, shading, illumination);
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
    private processScanLineGouraud(data: GouraudShading, va: Vertex, vb: Vertex, vc: Vertex, vd: Vertex) {
        let pa = va.coordinates;
        let pb = vb.coordinates;
        let pc = vc.coordinates;
        let pd = vd.coordinates;

        let gradient1 = pa.y !== pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
        let gradient2 = pc.y !== pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

        let sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        let ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // Interpolating the color
        let Is = this.interpolate(data.Ia, data.Ib, gradient1);
        let Ie = this.interpolate(data.Ic, data.Id, gradient2);

        // Z-buffer
        let z1 = this.interpolate(pa.z, pb.z, gradient1);
        let z2 = this.interpolate(pc.z, pd.z, gradient2);

        for (let x = sx; x < ex; x++) {
            let gradient = (x - sx) / (ex - sx);
            let z = this.interpolate(z1, z2, gradient);
            let I = this.interpolate(Is, Ie, gradient);
            let color = new Color(255 * I, 255 * I, 255 * I, 255);

            this.drawPoint(new Vector3(x, data.currentY, z), color);
        }
    }

    // Phong shading - interpolating the vectors across the surface and computing the color for each point of interest
    // Draw line between 2 points from left to right, ab -> cd, points must be sorted
    private processScanLinePhong(data: PhongShading, va: Vertex, vb: Vertex, vc: Vertex, vd: Vertex) {
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
            let I = this.calculateIllumination(w, n, data.lights, data.cameraPosition, data.illumination);

            this.drawPoint(new Vector3(x, data.currentY, z), new Color(255 * I, 255 * I, 255 * I, 255));
        }
    }

    // Flat shading - single normal vector; shading for the entire triangle
    // Draw line between 2 points from left to right, ab -> cd, points must be sorted
    private processScanLineFlat(data: FlatShading, va: Vertex, vb: Vertex, vc: Vertex, vd: Vertex) {
        let pa = va.coordinates;
        let pb = vb.coordinates;
        let pc = vc.coordinates;
        let pd = vd.coordinates;

        let gradient1 = pa.y !== pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
        let gradient2 = pc.y !== pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

        let sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        let ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // Z-buffer
        let z1 = this.interpolate(pa.z, pb.z, gradient1);
        let z2 = this.interpolate(pc.z, pd.z, gradient2);

        for (let x = sx; x < ex; x++) {
            let gradient = (x - sx) / (ex - sx);
            let z = this.interpolate(z1, z2, gradient);
            let I = data.I;
            let color = new Color(255 * I, 255 * I, 255 * I, 255);

            this.drawPoint(new Vector3(x, data.currentY, z), color);
        }
    }

    // Phong/Blinn illumination model
    private calculateIllumination(worldCoordinates: Vector3, normal: Vector3, lights: Light[], eyePosition: Vector3, illumination: Illumination) {
        const ka = 0.1;
        const kd = 0.6;
        const ks = 0.3;
        const pow = 50;
        const c = 130;
        let result = ka;

        lights.forEach(light => {
            let L = Vector3.difference(light.position, worldCoordinates).normalize();
            let ndotl = this.calculateCos(normal, L);
            let V = Vector3.difference(eyePosition, worldCoordinates).normalize();
            let I = 0;

            if (illumination === Illumination.Phong) {
                let R = Vector3.difference(normal.copy().scale(2 * ndotl), L);
                let rdotv = this.calculateCos(R, V);
                I += kd * ndotl + ks * rdotv;
            }
            else {
                let H = L.copy().add(V).normalize();
                let ndoth = this.calculateCos(normal, H);
                I += kd * ndotl + ks * ndoth;
            }

            if (this.isReflector(light)) {
                let reflectorDirection = Vector3.difference(light.position, light.target).normalize();
                let rddotl = Math.pow(this.calculateCos(reflectorDirection, L), pow);
                I *= rddotl;
            } else {
                let distance = Vector3.distance(light.position, worldCoordinates);
                I = I * c / (distance * distance);
            }

            result += I;
        });

        return Math.min(result, 1);
    }

    private isReflector(light: Light): light is Reflector {
        return (light as Reflector).target !== undefined;
    }

    private calculateCos(vector1: Vector3, vector2: Vector3) {
        return Math.max(0, Vector3.dot(vector1, vector2));
    }

    // private computeNDotL(vertex: Vector3, normal: Vector3, lightPosition: Vector3) {
    //     let lightDirection = Vector3.difference(lightPosition, vertex).normalize();
    //     return Math.max(0, Vector3.dot(normal, lightDirection));
    // }

    private drawTriangle(v1: Vertex, v2: Vertex, v3: Vertex, lights: Light[], cameraPosition: Vector3, shading: ShadingType, illumination: Illumination) {
        [v1, v2, v3] = [v1, v2, v3].sort((v1, v2) => v1.coordinates.y < v2.coordinates.y ? -1 : 1);
        let p1 = v1.coordinates;
        let p2 = v2.coordinates;
        let p3 = v3.coordinates;

        // Gouraud shading
        let I1: number = 0, I2: number = 0, I3: number = 0;
        if (shading === ShadingType.Gouraud) {
            I1 = this.calculateIllumination(v1.worldCoordinates, v1.normal, lights, cameraPosition, illumination);
            I2 = this.calculateIllumination(v2.worldCoordinates, v2.normal, lights, cameraPosition, illumination);
            I3 = this.calculateIllumination(v3.worldCoordinates, v3.normal, lights, cameraPosition, illumination);
        }

        // Flat shading
        let I: number = 0;
        if (shading === ShadingType.Flat) {
            let vnFace = (v1.normal.add(v2.normal.add(v3.normal))).scale(1 / 3);
            let centerPoint = (v1.worldCoordinates.add(v2.worldCoordinates.add(v3.worldCoordinates))).scale(1 / 3);
            I = this.calculateIllumination(centerPoint, vnFace, lights, cameraPosition, illumination);
        }

        // Slopes
        let dP1P2 = p2.y - p1.y > 0 ? (p2.x - p1.x) / (p2.y - p1.y) : 0;
        let dP1P3 = p3.y - p1.y > 0 ? (p3.x - p1.x) / (p3.y - p1.y) : 0;

        // P3 on the left
        if (dP1P2 > dP1P3) {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (shading === ShadingType.Gouraud) {
                    if (y < p2.y) {
                        let data: GouraudShading = { currentY: y, Ia: I1, Ib: I3, Ic: I1, Id: I2 };
                        this.processScanLineGouraud(data, v1, v3, v1, v2);
                    } else {
                        let data: GouraudShading = { currentY: y, Ia: I1, Ib: I3, Ic: I2, Id: I3 };
                        this.processScanLineGouraud(data, v1, v3, v2, v3);
                    }
                } else if (shading === ShadingType.Phong) {
                    let data: PhongShading = { currentY: y, lights, cameraPosition, illumination };
                    if (y < p2.y) {
                        this.processScanLinePhong(data, v1, v3, v1, v2);
                    } else {
                        this.processScanLinePhong(data, v1, v3, v2, v3);
                    }
                } else if (shading === ShadingType.Flat) {
                    let data: FlatShading = { currentY: y, I };
                    if (y < p2.y) {
                        this.processScanLineFlat(data, v1, v3, v1, v2);
                    } else {
                        this.processScanLineFlat(data, v1, v3, v2, v3);
                    }
                }
            }
        // P2 on the left
        } else {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (shading === ShadingType.Gouraud) {
                    if (y < p2.y) {
                        let data: GouraudShading = { currentY: y, Ia: I1, Ib: I2, Ic: I1, Id: I3 };
                        this.processScanLineGouraud(data, v1, v2, v1, v3);
                    } else {
                        let data: GouraudShading = { currentY: y, Ia: I2, Ib: I3, Ic: I1, Id: I3 };
                        this.processScanLineGouraud(data, v2, v3, v1, v3);
                    }
                } else if (shading === ShadingType.Phong) {
                    let data: PhongShading = { currentY: y, lights, cameraPosition, illumination };
                    if (y < p2.y) {
                        this.processScanLinePhong(data, v1, v2, v1, v3);
                    } else {
                        this.processScanLinePhong(data, v2, v3, v1, v3);
                    }
                } else if (shading === ShadingType.Flat) {
                    let data: FlatShading = { currentY: y, I };
                    if (y < p2.y) {
                        this.processScanLineFlat(data, v1, v2, v1, v3);
                    } else {
                        this.processScanLineFlat(data, v2, v3, v1, v3);
                    }
                }
            }
        }
    }
}
