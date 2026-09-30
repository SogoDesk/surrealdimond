/**
 * Program requests the dealer has sent from this browser (the preview's
 * stand-in for the platform): Made to Order requests from the M2O form and
 * custom requests from the Custom Portal. The dashboard lists them as "Your
 * requests"; the admin console's Program requests inbox replaces this store.
 */

import { createLocalStore } from "./localStore";

export interface M2ORequest {
  number: string;
  shape: string;
  size: string;
  sentAt: string;
}

export interface CustomRequest {
  number: string;
  item: string;
  shape: string;
  carat: string;
  images: string[];
  sentAt: string;
}

const isList = <T,>(v: unknown): v is T[] => Array.isArray(v);

export const m2oRequests = createLocalStore<M2ORequest[]>("surreal-m2o", [], isList<M2ORequest>);
export const customRequests = createLocalStore<CustomRequest[]>("surreal-custom", [], isList<CustomRequest>);

export const useM2ORequests = m2oRequests.useStore;
export const useCustomRequests = customRequests.useStore;
