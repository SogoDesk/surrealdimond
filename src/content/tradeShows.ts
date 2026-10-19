/**
 * The trade shows Surreal exhibits at, for the dashboard's Trade show
 * appointments page (BRD R-26). Empty until Surreal sends its show calendar
 * (Q9); nothing here is guessed. The admin console's Content module takes
 * the list over.
 */

export interface TradeShow {
  id: string;
  name: string;
  city: string;
  /** Human dates, as Surreal writes them, e.g. "May 29 to June 1, 2027" */
  dates: string;
  booth?: string;
}

export const tradeShows: TradeShow[] = [];
