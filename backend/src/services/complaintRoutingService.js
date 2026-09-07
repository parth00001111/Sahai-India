const departmentByCategory = {
  sanitation: "Municipal sanitation department",
  roads: "Public works / roads department",
  water: "Water supply department",
  electricity: "Electricity distribution utility",
  healthcare: "District health office",
  food: "Food and civil supplies department",
  shelter: "District social welfare office",
  disaster: "District disaster management authority",
  safety: "District police / public safety control room",
  other: "District administration",
};

export function routeComplaint(category, location) {
  const key = Object.hasOwn(departmentByCategory, category) ? category : "other";
  return {
    category: key,
    department: departmentByCategory[key],
    jurisdiction: [location.district, location.state].filter(Boolean).join(", "),
  };
}
