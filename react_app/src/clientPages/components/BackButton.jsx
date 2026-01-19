import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Volver"
      className="flex items-center gap-2  font-medium
                 hover:opacity-80 transition"
    >
      <ArrowLeft size={20} />
      <span>Volver</span>
    </button>
  );
}
