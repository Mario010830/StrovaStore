import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

interface ErrorInfo {
  title: string;
  message: string;
  retryable: boolean;
}

function hasStatus(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error != null && "status" in error;
}

export function getRtkErrorInfo(error: unknown): ErrorInfo {
  if (!hasStatus(error)) {
    return {
      title: "Error inesperado",
      message: "Ocurrió un problema inesperado. Intenta nuevamente.",
      retryable: true,
    };
  }

  const status = error.status;
  if (status === "FETCH_ERROR") {
    return {
      title: "Sin conexión",
      message: "No se pudo conectar con el servidor. Revisa tu conexión e intenta otra vez.",
      retryable: true,
    };
  }
  if (status === "TIMEOUT_ERROR") {
    return {
      title: "Tiempo de espera agotado",
      message: "El servidor tardó demasiado en responder. Intenta nuevamente.",
      retryable: true,
    };
  }
  if (status === "PARSING_ERROR") {
    return {
      title: "Respuesta inválida",
      message: "Recibimos una respuesta inesperada del servidor.",
      retryable: true,
    };
  }
  if (typeof status === "number") {
    if (status >= 500) {
      return {
        title: "Error del servidor",
        message: "El servidor presentó un problema interno. Intenta en unos minutos.",
        retryable: true,
      };
    }
    if (status === 404) {
      return {
        title: "No encontrado",
        message: "El recurso solicitado no existe o ya no está disponible.",
        retryable: false,
      };
    }
    if (status === 401 || status === 403) {
      return {
        title: "Acceso denegado",
        message: "No tienes permisos para acceder a este recurso.",
        retryable: false,
      };
    }
    return {
      title: "Solicitud inválida",
      message: "No pudimos procesar la solicitud actual.",
      retryable: true,
    };
  }

  return {
    title: "Error de red",
    message: "No fue posible completar la operación.",
    retryable: true,
  };
}
