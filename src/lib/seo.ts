import { getLineLabel, getFigureAttributes, getAttributeLabel } from "./figureTaxonomy";
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

const DEFAULT_TITLE = "Pokémon Tomy Collection";
const DEFAULT_DESCRIPTION = "Personal catalogue of Pokémon Tomy, Moncolle, T-Arts figures and variants. Browse by generation, collection, volume and special attributes.";
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
  const name = figure.pokemon?.full_names?.es || `Figure #${String(figure.pokemon?.pokedex_number).padStart(4, "0")}`;
  const line = getLineLabel(figure.line);
  const attributes = getFigureAttributes(figure).map((a: string) => getAttributeLabel(a));
  const collection = figure.volumes?.collections?.name;
  const volume = figure.volumes ? `Vol. ${figure.volumes.volume}${figure.volumes.name_eng ? ` · ${figure.volumes.name_eng}` : ""}` : "";
  const year = figure.year ? `Year ${figure.year}` : "";

  const parts = [name, line, collection, volume, year, ...attributes].filter(Boolean);
  const description = truncateDescription(parts.join(" · ")) || DEFAULT_DESCRIPTION;
  const title = makeTitle(`${name} (${line})`);

  return baseMeta(title, description, `/figure/${figure.slug ?? figure.id}`, siteUrl);
}

export function collectionMeta(collection: any, volumesCount: number, figuresCount: number, siteUrl: string): SeoMeta {
  const title = makeTitle(collection.name);
  const description = truncateDescription(
    `${collection.name}. Pokémon Tomy collection with ${volumesCount} volumes and ${figuresCount} figures. Browse the full catalogue.`
  );
  return baseMeta(title, description, `/collection/${createSlug(collection.name)}`, siteUrl);
}

export function volumeMeta(collection: any, volume: any, figuresCount: number, siteUrl: string): SeoMeta {
  const subtitle = `Vol. ${volume.volume}${volume.name_eng ? ` · ${volume.name_eng}` : ""}`;
  const volumeSlug = volume.name_eng ? createSlug(volume.name_eng) : String(volume.volume);
  const title = makeTitle(`${collection.name} - ${subtitle}`);
  const description = truncateDescription(
    `${collection.name} · ${subtitle}. ${figuresCount} Pokémon Tomy figures in this volume.`
  );
  return baseMeta(title, description, `/collection/${createSlug(collection.name)}/volume/${volumeSlug}`, siteUrl);
}

export function attributeMeta(label: string, slug: string, figuresCount: number, siteUrl: string): SeoMeta {
  const title = makeTitle(label);
  const description = truncateDescription(
    `${label}. ${figuresCount} Pokémon Tomy figures with this special attribute in the catalogue.`
  );
  return baseMeta(title, description, `/attribute/${slug}`, siteUrl);
}

export function homeMeta(figuresCount: number, siteUrl: string): SeoMeta {
  const title = DEFAULT_TITLE;
  const description = truncateDescription(
    `Personal catalogue of Pokémon Tomy, Moncolle and T-Arts figures. ${figuresCount} figures organised by generation, collection, volume and attributes.`
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
  const name = figure.pokemon?.full_names?.es || `Figure #${String(figure.pokemon?.pokedex_number).padStart(4, "0")}`;
  const attributes = getFigureAttributes(figure).map((a: string) => getAttributeLabel(a));
  const descriptionParts = [
    name,
    getLineLabel(figure.line),
    figure.volumes?.collections?.name,
    figure.year ? `Year ${figure.year}` : "",
    ...attributes,
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
  collection: any,
  siteUrl: string,
  figuresCount: number,
  imageUrls?: string[]
): SchemaCollectionPage {
  const url = `${siteUrl.replace(/\/$/, "")}/collection/${createSlug(collection.name)}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    url,
    description: `${collection.name}. ${figuresCount} Pokémon Tomy figures in this collection.`,
    isPartOf: { "@type": "WebSite", url: siteUrl },
    hasPart: imageUrls?.length
      ? imageUrls.map((src) => ({
          "@type": "ImageObject",
          contentUrl: src,
          name: `Cover of ${collection.name}`,
        }))
      : undefined,
  };
}
