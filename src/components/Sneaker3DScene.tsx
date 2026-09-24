type Sneaker3DSceneProps = {
    modelUrl?: string;
};

export default function Sneaker3DScene({ modelUrl }: Sneaker3DSceneProps) {
    return (
        <div className="w-full h-64 bg-[#232323] rounded-lg flex items-center justify-center text-neutral-500 text-sm">
            {modelUrl ? '3D preview' : '3D preview unavailable'}
        </div>
    );
}