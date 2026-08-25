import { Drop } from '../../types';

export interface DropHydratedRow {
  id: string;
  sneaker_name: string;
  brand_id?: string;
  price: number;
  release_time: string;
  image_url: string;
  description?: string | null;
  subscribers_count?: number | null;
  raffle_open?: boolean | null;
  edition_size?: number | null;
  hype_level?: string | null;
  drop_type?: string | null;
  type?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  brands?: { id?: string; name: string; slug?: string; [key: string]: any } | null;
  [key: string]: any;
}

export const mapDropRowToDrop = (row: DropHydratedRow, isNotified = false): Drop => {
  const dropType = row.drop_type || row.type || 'Raffle Draw';
  return {
    id: row.id,
    sneakerName: row.sneaker_name,
    brand: row.brands?.name || 'Nike',
    price: Number(row.price),
    releaseTime: row.release_time,
    image: row.image_url,
    description: row.description || '',
    isNotified,
    subscribersCount: row.subscribers_count || 0,
    raffleOpen: Boolean(row.raffle_open),
    editionSize: row.edition_size || 100,
    hypeLevel: row.hype_level || 'EXTREME',
    type: dropType,
    dropType: dropType
  };
};

export const mapDropRowsToDrops = (rows: DropHydratedRow[]): Drop[] => {
  return rows.map(r => mapDropRowToDrop(r));
};
