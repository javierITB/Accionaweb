import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MENU_STRUCTURE } from "../config/menuStructure.js";
import { getFirstAdminRoute } from "../utils/getFirstAdminRoute.js";

export default function PanelEntry({ userPermissions }) {
  const navigate = useNavigate();

  const hasPermission = (perm) => {
    if (!perm) return true;
    return userPermissions.includes(perm);
  };

  useEffect(() => {
    const firstRoute = getFirstAdminRoute(MENU_STRUCTURE, hasPermission);
    navigate(firstRoute, { replace: true });
  }, []);

  return null;
}

