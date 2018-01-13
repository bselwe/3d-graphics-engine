import { matrix, multiply } from "mathjs";
import { Color } from "../Models/Color";
import { Camera } from "./Camera";
import { Mesh } from "./Mesh";
import { Vector3 } from "../Models/Vector3";
import { Vector2 } from "../Models/Vector2";
import { Transformations } from "./Transformations";

export class Device {
    private buffer: ImageData;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    public clear() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.buffer = this.context.getImageData(0, 0, this.width, this.height);
    }

    public render(camera: Camera, meshes: Mesh[]) {
        let viewMatrix = Transformations.lookAt(camera.position, camera.target, Vector3.UP);
        let projectionMatrix = Transformations.perspective();

        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];

            let scale = Transformations.scale(1, 1, 1);
            let rotation = Transformations.rotate(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            let translation = Transformations.translate(mesh.position.x, mesh.position.y, mesh.position.z);

            let worldMatrix = multiply(translation, multiply(rotation, scale));
            let transformMatrix = multiply(projectionMatrix, multiply(worldMatrix, viewMatrix));

            for (let j = 0; j < mesh.vertices.length; j++) {
                let vertex = mesh.vertices[j];
                let projectedPoint = this.projectCoordinates(vertex, transformMatrix);
                this.drawPoint(projectedPoint);
            }
        }

        this.context.putImageData(this.buffer, 0, 0);
    }

    // Transform 3D coordinates to 2D coordinates using transformation matrix
    private projectCoordinates(coords: Vector3, transformMatrix: mathjs.Matrix) {
        let vector = [...coords.array, 1];
        let point = multiply(transformMatrix, vector);

        let x = point.get([0]) / point.get([3]);
        let y = point.get([1]) / point.get([3]);

        x = (x + 1) / 2 * this.width;
        y = (y + 1) / 2 * this.height;

        return new Vector2(x, y);
    }

    private drawPoint(point: Vector2) {
        if (point.x >= 0 && point.y >= 0 && point.x <= this.width && point.y <= this.height) {
            this.putPixel(point.x, point.y, new Color(255, 255, 255, 255));
        }
    }

    private putPixel(x: number, y: number, color: Color) {
        let bufferData = this.buffer.data;
        let index = ((x >> 0) + (y >> 0) * this.width) * 4;

        bufferData[index] = color.r;
        bufferData[index + 1] = color.g;
        bufferData[index + 2] = color.b;
        bufferData[index + 3] = color.a;
    }
}
