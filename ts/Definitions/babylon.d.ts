interface Babylon {
    readonly meshes: BabylonMesh[];
}

interface BabylonMesh {
    readonly name: string;
    readonly indices: number[];
    readonly vertices: number[];
    readonly uvCount: number;
    readonly position: number[];
}

declare module "*.babylon.json" {
    const babylon: Babylon;
    export default babylon;
}
