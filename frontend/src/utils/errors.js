export function getErrorMessage(err, fallback = 'Algo salió mal. Probá de nuevo.') {
  if (!err) return fallback;

  if (err.response?.data?.error) {
    return err.response.data.error;
  }

  if (err.request && !err.response) {
    return 'No pudimos conectarnos con el servidor. Revisá tu conexión.';
  }

  if (err.message) {
    return err.message;
  }

  return fallback;
}
