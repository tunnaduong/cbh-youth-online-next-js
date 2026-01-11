import ViewMaterialClient from "./ViewMaterialClient";
import { getStudyMaterial } from "@/app/Api";

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const response = await getStudyMaterial(id);
    const material = response.data;
    return {
      title: `Đang xem: ${material.title} | CBH Youth Online`,
      description: material.description,
    };
  } catch (error) {
    return {
      title: "Xem tài liệu | CBH Youth Online",
    };
  }
}

export default function page({ params }) {
  return <ViewMaterialClient materialId={params.id} />;
}
