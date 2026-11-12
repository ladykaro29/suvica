/**
 * Comprime y redimensiona una imagen en el navegador a un tamaño óptimo de 960px
 * (ancho o alto) en formato JPEG con calidad 0.72 para subida ultrarrápida a Gemini IA.
 */
export async function compressImageClient(
  file: File,
  maxDimension = 960,
  quality = 0.72
): Promise<{ dataUrl: string; width: number; height: number; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("No se pudo leer el archivo de imagen seleccionado."));
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error("El archivo seleccionado no es una imagen válida."));
      };

      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Tu navegador no soporta procesamiento Canvas 2D."));
          return;
        }

        // Fondo blanco por si la imagen origen tiene transparencias
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64Length = dataUrl.split(",")[1]?.length || 0;
        const sizeKB = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          sizeKB,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
