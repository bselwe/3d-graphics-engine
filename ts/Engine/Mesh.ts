import { Vector3 } from "../Models/Vector3";

export interface Face {
    readonly A: number;
    readonly B: number;
    readonly C: number;
}

export class Mesh {
    name: string;
    position: Vector3;
    rotation: Vector3;
    vertices: Vector3[];
    faces: Face[];

    constructor(name: string, verticesCount: number, facesCount: number) {
        this.name = name;
        this.vertices = new Array(verticesCount);
        this.faces = new Array(facesCount);
        this.position = Vector3.ZERO;
        this.rotation = Vector3.ZERO;
    }

    public static fromBabylon(babylon: Babylon): Mesh[] {
        let meshes: Mesh[] = [];

        for (let i = 0; i < babylon.meshes.length; i++) {
            let babylonMesh = babylon.meshes[i];

            let vertices = babylonMesh.vertices;
            let faces = babylonMesh.indices;
            let uvCount = babylonMesh.uvCount;
            let verticesStep = uvCount === 0 ? 6 : uvCount === 1 ? 8 : 10;
            let verticesCount = vertices.length / verticesStep;
            let facesCount = faces.length / 3;

            let mesh = new Mesh(babylonMesh.name, verticesCount, facesCount);

            for (let j = 0; j < verticesCount; j++) {
                let x = vertices[j * verticesStep];
                let y = vertices[j * verticesStep + 1];
                let z = vertices[j * verticesStep + 2];
                mesh.vertices[j] = new Vector3(x, y, z);
            }

            for (let j = 0; j < facesCount; j++) {
                let a = faces[j * 3];
                let b = faces[j * 3 + 1];
                let c = faces[j * 3 + 2];
                mesh.faces[j] = { A: a, B: b, C: c };
            }

            let position = babylonMesh.position;
            mesh.position = new Vector3(position[0], position[1], position[2]);
            meshes.push(mesh);
        }

        return meshes;
    }
}
