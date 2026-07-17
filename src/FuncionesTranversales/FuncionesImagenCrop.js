function cargarImagenDesdeUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

export async function recortarImagenACroppedFile(imageSrc, croppedAreaPixels, {
    fileName = "imagen.jpg",
    mimeType = "image/jpeg",
    quality = 0.9,
    maxDimension = 1600,
} = {}) {
    const img = await cargarImagenDesdeUrl(imageSrc);

    const { x, y, width, height } = croppedAreaPixels;
    const scale = Math.min(maxDimension / width, maxDimension / height, 1);
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, x, y, width, height, 0, 0, targetW, targetH);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    if (!blob) throw new Error("No fue posible generar la imagen recortada.");

    const baseName = fileName.replace(/\.\w+$/, "") || "imagen";
    return new File([blob], `${baseName}.jpg`, { type: mimeType });
}
