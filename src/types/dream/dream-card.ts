import { DiagramData } from './dream-diagram';

export interface DreamCardMetadata {
  diagram?: DiagramData;
  associated_assets?: string[];
  associated_collections?: string[];
  strategy?: string;
  draft_product_id?: string;
  draft_collection_id?: string;
  draft_category_id?: string;
}

export interface DreamCard {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string;
  image_url?: string;
  category_id?: string;
  position: number;
  metadata: DreamCardMetadata;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  comments_count?: number;
}

export interface DreamComment {
  id: string;
  card_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}
