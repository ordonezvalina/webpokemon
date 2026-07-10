import { getLineaLabel, getFigureAtributos, getAtributoLabel } from "./figureTaxonomy";
import { createSlug } from "./slug";

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  og: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
    image?: string;
  };
}

const DEFAULT_TITLE = "Colección Pokémon Tomy";
const DEFAULT_DESCRIPTION = "Catálogo personal de figuras Pokémon Tomy, Moncolle, T-Arts y variantes. Explora por generación, colección, volumen y atributos especiales.";
const SEPARATOR = " | ";

export function makeTitle(pageTitle: string): string {
  if (!pageTitle || pageTitle === DEFAULT_TITLE) return DEFAULT_TITLE;
  return `${pageTitle}${SEPARATOR}${DEFAULT_TITLE}`;
}

export function truncateDescription(text: string, max = 160): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

export function figureMeta(figure: any, siteUrl: string): SeoMeta {
  const name = figure.pokemon?.full_names?.es || `Figura #${String(figure.pokemon?.pokedex_number).padStart(4, "0")}`;
  const line = getLineaLabel(figure.line);
  const atributos = getFigureAtributos(figure).map((a: string) => getAtributoLabel(a));
  const coleccion = figure.volumes?.collections?.name;
  const volumen = figure.volumes ? `Vol. ${figure.volumes.volume}${figure.volumes.name_eng ? ` · ${figure.volumes.name_eng}` : ""}` : "";
  const year = figure.year ? `Año ${figure.year}` : "";

  const parts = [name, line, coleccion, volumen, year, ...atributos].filter(Boolean);
  const description = truncateDescription(parts.join(" · ")) || DEFAULT_DESCRIPTION;
  const title = makeTitle(`${name} (${line})`);

  return baseMeta(title, description, `/figure/${figure.slug ?? figure.id}`, siteUrl);
}

export function collectionMeta(coleccion: any, volumesCount: number, figuresCount: number, siteUrl: string): SeoMeta {
  const title = makeTitle(coleccion.name);
  const description = truncateDescription(
    `${coleccion.name}. Colección de Pokémon Tomy con ${volumesCount} volúmenes y ${figuresCount} figuras. Explora el catálogo completo.`
  );
  return baseMeta(title, description, `/collection/${createSlug(coleccion.name)}`, siteUrl);
}

export function volumeMeta(coleccion: any, volumen: any, figuresCount: number, siteUrl: string): SeoMeta {
  const subtitle = `Vol. ${volumen.volume}${volumen.name_eng ? ` · ${volumen.name_eng}` : ""}`;
  const volumenSlug = volumen.name_eng ? createSlug(volumen.name_eng) : String(volumen.volume);
  const title = makeTitle(`${coleccion.name} - ${subtitle}`);
  const description = truncateDescription(
    `${coleccion.name} · ${subtitle}. ${figuresCount} figuras Pokémon Tomy en este volumen.`
  );
  return baseMeta(title, description, `/collection/${createSlug(coleccion.name)}/volume/${volumenSlug}`, siteUrl);
}

export function attributeMeta(label: string, slug: string, figuresCount: number, siteUrl: string): SeoMeta {
  const title = makeTitle(label);
  const description = truncateDescription(
    `${label}. ${figuresCount} figuras Pokémon Tomy con este atributo especial en el catálogo.`
  );
  return baseMeta(title, description, `/attribute/${slug}`, siteUrl);
}

export function homeMeta(figuresCount: number, siteUrl: string): SeoMeta {
  const title = DEFAULT_TITLE;
  const description = truncateDescription(
    `Catálogo personal de figuras Pokémon Tomy, Moncolle y T-Arts. ${figuresCount} figuras organizadas por generación, colección, volumen y atributos.`
  );
  return baseMeta(title, description, "/", siteUrl);
}

function baseMeta(title: string, description: string, path: string, siteUrl: string): SeoMeta {
  const canonical = `${siteUrl.replace(/\/$/, "")}${path}`;
  return {
    title,
    description,
    canonical,
    og: {
      title,
      description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function addImage(meta: SeoMeta, imageUrl?: string): SeoMeta {
  if (!imageUrl) return meta;
  return {
    ...meta,
    og: { ...meta.og, image: imageUrl },
    twitter: { ...meta.twitter, image: imageUrl },
  };
}

export function absoluteImageUrl(siteUrl: string, imagePath?: string): string | undefined {
  if (!imagePath) return undefined;
  if (imagePath.startsWith("http")) return imagePath;
  const base = siteUrl.replace(/\/$/, "");
  const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${base}${path}`;
}

// Schema.org helpers

export interface SchemaWebSite {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
}

export interface SchemaCollectionPage {
  "@context": "https://schema.org";
  "@type": "CollectionPage";
  name: string;
  url: string;
  description: string;
  isPartOf?: { "@type": "WebSite"; url: string };
  hasPart?: { "@type": "ImageObject"; contentUrl: string; name: string }[];
}

export interface SchemaItemPage {
  "@context": "https://schema.org";
  "@type": "ItemPage";
  name: string;
  url: string;
  description: string;
  mainEntity?: any;
  isPartOf?: { "@type": "WebSite"; url: string };
}

export interface SchemaBreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}

export function webSiteSchema(siteUrl: string, description: string): SchemaWebSite {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_TITLE,
    url: siteUrl,
    description,
  };
}

export function breadcrumbSchema(items: { label: string; href?: string }[], siteUrl: string): SchemaBreadcrumbList {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${base}${item.href}` } : {}),
    })),
  };
}

export function figureSchema(figure: any, siteUrl: string, imageUrl?: string): SchemaItemPage {
  const name = figure.pokemon?.full_names?.es || `Figura #${String(figure.pokemon?.pokedex_number).padStart(4, "0")}`;
  const atributos = getFigureAtributos(figure).map((a: string) => getAtributoLabel(a));
  const descriptionParts = [
    name,
    getLineaLabel(figure.line),
    figure.volumes?.collections?.name,
    figure.year ? `Año ${figure.year}` : "",
    ...atributos,
  ].filter(Boolean);

  const mainEntity: any = {
    "@type": "Product",
    name,
    description: truncateDescription(figure.details || descriptionParts.join(" · ")),
    url: `${siteUrl.replace(/\/$/, "")}/figure/${figure.slug ?? figure.id}`,
  };

  if (imageUrl) mainEntity.image = imageUrl;
  if (figure.year) mainEntity.releaseDate = figure.year;
  if (figure.mfc_id) {
    mainEntity.identifier = {
      "@type": "PropertyValue",
      propertyID: "MyFigureCollection",
      value: figure.mfc_id,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name,
    url: mainEntity.url,
    description: truncateDescription(descriptionParts.join(" · ")),
    mainEntity,
    isPartOf: { "@type": "WebSite", url: siteUrl },
  };
}

export function collectionSchema(
  coleccion: any,
  siteUrl: string,
  figuresCount: number,
  imageUrls?: string[]
): SchemaCollectionPage {
  const url = `${siteUrl.replace(/\/$/, "")}/collection/${createSlug(coleccion.name)}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: coleccion.name,
    url,
    description: `${coleccion.name}. ${figuresCount} figuras Pokémon Tomy en esta colección.`,
    isPartOf: { "@type": "WebSite", url: siteUrl },
    hasPart: imageUrls?.length
      ? imageUrls.map((src) => ({
          "@type": "ImageObject",
          contentUrl: src,
          name: `Portada de ${coleccion.name}`,
        }))
      : undefined,
  };
}
