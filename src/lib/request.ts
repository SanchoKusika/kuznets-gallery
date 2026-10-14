/** Request (заявка) rules shared by the drawer and the API. */

/** A phone number needs at least 9 digits (prototype `okP`). */
export const isPhoneValid = (phone: string) => phone.replace(/\D/g, "").length >= 9;

/** One line of a request as sent to the API (prototype `items` of a saved request). */
export type RequestItem = {
  code: string;
  title: string;
  image: string;
  w: number | null;
  h: number | null;
  price: number | null;
  frame: string;
  qty: number;
};

export type RequestPayload = { name: string; phone: string; comment: string; items: RequestItem[] };
