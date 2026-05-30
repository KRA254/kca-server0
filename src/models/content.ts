import { Schema, model, type InferSchemaType } from "mongoose";

const ContentBlockSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: false, maxlength: 180 },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

const PageSectionSchema = new Schema(
  {
    heading: { type: String, required: true, maxlength: 180 },
    body: { type: String, required: true },
  },
  { _id: false }
);

const ContentPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 180 },
    kicker: { type: String, required: false, maxlength: 120 },
    sections: { type: [PageSectionSchema], required: true, default: [] },
  },
  { timestamps: true }
);

const NavLinkSchema = new Schema(
  {
    to: { type: String, required: true },
    label: { type: String, required: true, maxlength: 80 },
  },
  { _id: false }
);

const FooterSectionSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 80 },
    links: { type: [NavLinkSchema], required: true, default: [] },
  },
  { _id: false }
);

const SiteConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    brand: {
      name: { type: String, required: true },
      tagline: { type: String, required: false },
      logoText: { type: String, required: false },
    },
    nav: { type: [NavLinkSchema], required: true, default: [] },
    footer: {
      about: { type: String, required: false },
      sections: { type: [FooterSectionSchema], required: true, default: [] },
      tipLine: { type: String, required: false },
    },
  },
  { timestamps: true }
);

export type ContentBlockDocument = InferSchemaType<typeof ContentBlockSchema>;
export type ContentPageDocument = InferSchemaType<typeof ContentPageSchema>;
export type SiteConfigDocument = InferSchemaType<typeof SiteConfigSchema>;
export const ContentBlockModel = model("ContentBlock", ContentBlockSchema);
export const ContentPageModel = model("ContentPage", ContentPageSchema);
export const SiteConfigModel = model("SiteConfig", SiteConfigSchema);
