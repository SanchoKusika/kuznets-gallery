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
  /**
   * Price of the framing per piece when it is not the canvas on a stretcher (baget, glass are «расчёт отдельно»):
   * entered by the manager in the admin panel; null or absent — not counted yet. The site never sends it.
   */
  framePrice?: number | null;
  qty: number;
  /** Link to the print-ready original (Google Drive, Telegram…); the admin panel only. */
  original?: string;
  /** The manager's note on the line; the admin panel only. */
  note?: string;
  /** The line is made (the order's progress); the admin panel only. */
  done?: boolean;
  /** The line's own id, given when a picture starts uploading to it (the line may move meanwhile); the admin panel only. */
  id?: string;
};

export type RequestPayload = { name: string; phone: string; comment: string; items: RequestItem[] };
