import { matrix, multiply } from "mathjs";
import { Color } from "../Models/Color";
import { Camera } from "./Camera";
import { Mesh } from "./Mesh";
import { Vector3 } from "../Models/Vector3";
import { Vector2 } from "../Models/Vector2";
import { Transformations } from "./Transformations";

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

    public render(camera: Camera, meshes: Mesh[]) {
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

                let pixelA = this.projectCoordinates(vertexA, transformMatrix);
                let pixelB = this.projectCoordinates(vertexB, transformMatrix);
                let pixelC = this.projectCoordinates(vertexC, transformMatrix);

                let color = (0.25 + ((j % mesh.faces.length) / mesh.faces.length) * 0.75) * 255;
                this.drawTriangle(pixelA, pixelB, pixelC, new Color(color, color, color, 255));
            }
        }

        this.context.putImageData(this.backBuffer, 0, 0);
    }

    // Transform 3D coordinates to 2D coordinates using transformation matrix
    private projectCoordinates(coords: Vector3, transformMatrix: mathjs.Matrix) {
        let vector = [...coords.array, 1];
        let point = multiply(transformMatrix, vector);

        let x = point.get([0]) / point.get([3]);
        let y = point.get([1]) / point.get([3]);

        x = (x + 1) / 2 * this.width;
        y = (y + 1) / 2 * this.height;

        return new Vector3(x, y, point.get([2]));
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

    // Draw line between 2 points from left to right
    // ab -> cd, points are sorted
    private processScanLine(y: number, a: Vector3, b: Vector3, c: Vector3, d: Vector3, color: Color) {
        let gradient1 = a.y !== b.y ? (y - a.y) / (b.y - a.y) : 1;
        let gradient2 = c.y !== d.y ? (y - c.y) / (d.y - c.y) : 1;

        let sx = this.interpolate(a.x, b.x, gradient1) >> 0;
        let ex = this.interpolate(c.x, d.x, gradient2) >> 0;

        let z1 = this.interpolate(a.z, b.z, gradient1);
        let z2 = this.interpolate(c.z, d.z, gradient2);

        for (let x = sx; x < ex; x++) {
            let gradient = (x - sx) / (ex - sx);
            let z = this.interpolate(z1, z2, gradient);
            this.drawPoint(new Vector3(x, y, z), color);
        }
    }

    private drawTriangle(p1: Vector3, p2: Vector3, p3: Vector3, color: Color) {
        // Sort points
        [p1, p2, p3] = [p1, p2, p3].sort((p1, p2) => p1.y < p2.y ? -1 : 1);

        // Slopes
        let dP1P2 = p2.y - p1.y > 0 ? (p2.x - p1.x) / (p2.y - p1.y) : 0;
        let dP1P3 = p3.y - p1.y > 0 ? (p3.x - p1.x) / (p3.y - p1.y) : 0;

        // P3 on the left
        if (dP1P2 > dP1P3) {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (y < p2.y) {
                    this.processScanLine(y, p1, p3, p1, p2, color);
                } else {
                    this.processScanLine(y, p1, p3, p2, p3, color);
                }
            }
        // P2 on the left
        } else {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (y < p2.y) {
                    this.processScanLine(y, p1, p2, p1, p3, color);
                } else {
                    this.processScanLine(y, p2, p3, p1, p3, color);
                }
            }
        }
    }
}
