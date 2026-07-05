export const MAX_FOTOS = 4;

export function getFigurePhotos(figure) {
  if (Array.isArray(figure?.fotos_urls) && figure.fotos_urls.length > 0) {
    return figure.fotos_urls.filter(Boolean).slice(0, MAX_FOTOS);
  }

  if (figure?.foto_url) {
    return [figure.foto_url];
  }

  return [];
}
