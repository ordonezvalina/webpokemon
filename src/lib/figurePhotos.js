export const MAX_PHOTOS = 4;

export function getFigurePhotos(figure) {
  if (Array.isArray(figure?.images_urls) && figure.images_urls.length > 0) {
    return figure.images_urls.filter(Boolean).slice(0, MAX_PHOTOS);
  }

  if (figure?.image_url) {
    return [figure.image_url];
  }

  return [];
}
