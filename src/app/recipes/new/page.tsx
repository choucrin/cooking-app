import { Suspense } from "react";
import RecipeForm from "./RecipeForm";

export default function NewRecipePage() {
  return (
    <Suspense>
      <RecipeForm />
    </Suspense>
  );
}
