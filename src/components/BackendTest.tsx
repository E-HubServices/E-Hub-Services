import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function BackendTest() {
    const categories = useQuery(api.services.getCategories);

    if (categories === undefined) {
        return <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">Connecting to backend...</div>;
    }

    return (
        <div className="p-4 bg-green-100 text-green-800 rounded-md my-4">
            <h3 className="font-bold">Backend Connection to Convex Verified! ✅</h3>
            <p>Loaded {categories.length} service categories:</p>
            <ul className="list-disc pl-5 mt-2">
                {categories.map((cat) => (
                    <li key={cat._id}>{cat.name}</li>
                ))}
            </ul>
        </div>
    );
}
