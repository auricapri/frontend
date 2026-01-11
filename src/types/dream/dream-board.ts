export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  position: number;
}

export interface DreamBoard {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
}
