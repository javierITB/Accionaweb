export function getFirstAdminRoute(menu, hasPermission) {
  for (const item of menu) {
    if (item.isAccordion && item.children) {
      for (const child of item.children) {
        if (hasPermission(child.permission)) {
          return child.path;
        }
      }
    } else {
      if (hasPermission(item.permission)) {
        return item.path;
      }
    }
  }
  return "/";
}
