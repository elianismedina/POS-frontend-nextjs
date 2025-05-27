export function formatDate(date: Date | string | null | undefined): string {
  console.log("formatDate - Input:", date, "Type:", typeof date);

  if (!date) {
    console.log("formatDate - Date is null or undefined, returning 'N/A'");
    return "N/A";
  }

  if (typeof date === "object" && Object.keys(date).length === 0) {
    console.warn("formatDate - Received empty object, returning 'N/A'");
    return "N/A";
  }

  try {
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn("formatDate - Invalid date, returning 'N/A'");
      return "N/A";
    }
    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("formatDate - Error parsing date:", error);
    return "N/A";
  }
}
