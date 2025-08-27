export function getImageType(uri: string) {
  const ext = uri.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png": return "png";
    case "jpg":
    case "jpeg": return "jpeg";
    case "heic": return "heic";
    default: return "png";
  }
}