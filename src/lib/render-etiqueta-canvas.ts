import { DispositivoEtiqueta } from "@/components/EtiquetaQRModal";

/**
 * Renderiza la etiqueta física completa de activo fijo en un Canvas HTML5
 * con resolución de alta calidad (1000 x 520 px, 300 DPI para rotuladoras o impresoras)
 * y retorna el Data URL en formato PNG.
 */
export async function renderEtiquetaCompletaToPng(
  dispositivo: DispositivoEtiqueta,
  qrDataUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const width = 1000;
      const height = 520;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("No se pudo obtener el contexto 2D del Canvas.");
      }

      // 1. Fondo blanco limpio
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 2. Borde exterior de la etiqueta física con esquinas redondeadas
      const cornerRadius = 24;
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#0f172a"; // Slate-900 oscuro

      ctx.beginPath();
      ctx.roundRect(8, 8, width - 16, height - 16, cornerRadius);
      ctx.stroke();

      // 3. Encabezado de la etiqueta
      // Nombre de la Empresa
      const empresa = (dispositivo.trabajador.empresa || "SUVICA").toUpperCase();
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(empresa, 36, 52);

      // Subtítulo CONTROL TI
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const empresaWidth = ctx.measureText(empresa).width;
      ctx.fillText("•  CONTROL DE ACTIVOS TI", 46 + empresaWidth, 50);

      // Código de Activo (Pill a la derecha)
      const codigoActivo =
        dispositivo.codigoInventario ||
        `INV-${dispositivo.tipoEquipo.slice(0, 3).toUpperCase()}-${dispositivo.id.slice(-4).toUpperCase()}`;

      ctx.font = "bold 24px monospace, 'Courier New'";
      const codeWidth = ctx.measureText(codigoActivo).width;
      const pillW = codeWidth + 28;
      const pillH = 40;
      const pillX = width - 36 - pillW;
      const pillY = 22;

      // Fondo del pill
      ctx.fillStyle = "#eff6ff"; // Blue-50
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 10);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2563eb"; // Blue-600
      ctx.stroke();

      // Texto del código
      ctx.fillStyle = "#1e3a8a"; // Blue-900
      ctx.fillText(codigoActivo, pillX + 14, pillY + 28);

      // 4. Línea divisoria bajo el encabezado
      ctx.beginPath();
      ctx.moveTo(8, 76);
      ctx.lineTo(width - 8, 76);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      // 5. Cargar y dibujar el Código QR
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.onload = () => {
        try {
          const qrX = 40;
          const qrY = 100;
          const qrSize = 300;

          // Dibujar QR
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Borde fino alrededor del QR
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#cbd5e1";
          ctx.strokeRect(qrX, qrY, qrSize, qrSize);

          // Subtítulo bajo el QR
          ctx.fillStyle = "#475569";
          ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("ESCANEAR P/ AUDITAR", qrX + qrSize / 2, qrY + qrSize + 26);
          ctx.textAlign = "left"; // Restaurar alineación

          // 6. Columna Derecha con Información del Activo
          const infoX = 375;
          let currentY = 120;

          // Badges: Tipo de Equipo + Propiedad
          const tipo = (dispositivo.tipoEquipo || "EQUIPO").toUpperCase();
          const propiedad = (dispositivo.propiedad || "CORPORATIVO").toUpperCase();

          // Badge Tipo
          ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const tipoW = ctx.measureText(tipo).width + 20;
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.roundRect(infoX, currentY - 18, tipoW, 28, 6);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(tipo, infoX + 10, currentY + 2);

          // Badge Propiedad
          const propX = infoX + tipoW + 10;
          const propW = ctx.measureText(propiedad).width + 20;
          ctx.fillStyle = propiedad === "PERSONAL" ? "#fffbeb" : "#ecfdf5";
          ctx.beginPath();
          ctx.roundRect(propX, currentY - 18, propW, 28, 6);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = propiedad === "PERSONAL" ? "#f59e0b" : "#10b981";
          ctx.stroke();

          ctx.fillStyle = propiedad === "PERSONAL" ? "#b45309" : "#047857";
          ctx.fillText(propiedad, propX + 10, currentY + 2);

          // Marca y Modelo
          currentY += 45;
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const modelo = dispositivo.marcaModelo || "Modelo no especificado";
          // Truncar si es muy largo
          const modeloCortado = modelo.length > 36 ? modelo.slice(0, 34) + "..." : modelo;
          ctx.fillText(modeloCortado, infoX, currentY);

          // Serial S/N
          currentY += 38;
          ctx.fillStyle = "#64748b";
          ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText("S/N: ", infoX, currentY);

          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 22px monospace, 'Courier New'";
          const serialText = dispositivo.serial || "S/S (Sin serial)";
          ctx.fillText(serialText, infoX + 50, currentY);

          // MAC Address
          if (dispositivo.macAddress) {
            currentY += 32;
            ctx.fillStyle = "#64748b";
            ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("MAC: ", infoX, currentY);

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 18px monospace, 'Courier New'";
            ctx.fillText(dispositivo.macAddress, infoX + 54, currentY);
          }

          // IMEI si es celular
          if (dispositivo.tipoEquipo === "Celular" && dispositivo.imei1) {
            currentY += 32;
            ctx.fillStyle = "#64748b";
            ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.fillText("IMEI: ", infoX, currentY);

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 18px monospace, 'Courier New'";
            ctx.fillText(dispositivo.imei1, infoX + 54, currentY);
          }

          // Línea divisoria antes del responsable
          currentY += 24;
          ctx.beginPath();
          ctx.moveTo(infoX, currentY);
          ctx.lineTo(width - 36, currentY);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#e2e8f0";
          ctx.stroke();

          // Responsable o Departamento
          currentY += 28;
          const esDepto = dispositivo.trabajador.cedula.startsWith("DEPTO-");
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const titular = `${esDepto ? "🏢 " : "👤 "}${dispositivo.trabajador.nombre}`;
          const titularCortado = titular.length > 40 ? titular.slice(0, 38) + "..." : titular;
          ctx.fillText(titularCortado, infoX, currentY);

          // Departamento y Fecha
          currentY += 26;
          ctx.fillStyle = "#64748b";
          ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          const fechaStr = new Date(dispositivo.createdAt).toLocaleDateString("es-VE", {
            month: "2-digit",
            year: "numeric",
          });
          ctx.fillText(`${dispositivo.trabajador.departamento}  •  ${fechaStr}`, infoX, currentY);

          // 7. Pie de seguridad de la etiqueta física
          ctx.beginPath();
          ctx.moveTo(8, height - 48);
          ctx.lineTo(width - 8, height - 48);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#0f172a";
          ctx.stroke();

          ctx.fillStyle = "#475569";
          ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText("SUVICA  •  PROPIEDAD DE LA EMPRESA  -  NO REMOVER ETIQUETA", 36, height - 20);

          ctx.textAlign = "right";
          ctx.fillText("REGISTRO AUDITABLE", width - 36, height - 20);
          ctx.textAlign = "left";

          const pngData = canvas.toDataURL("image/png");
          resolve(pngData);
        } catch (drawErr) {
          reject(drawErr);
        }
      };

      qrImg.onerror = (e) => {
        reject(new Error("No se pudo cargar la imagen del código QR para componer la etiqueta."));
      };

      qrImg.src = qrDataUrl;
    } catch (err) {
      reject(err);
    }
  });
}

