export interface Book {
  id: number;
  name: string;
  author: string;
  summary: string;
  rating: number;
  pages: number;
  published_on: Date;
  _created_on: string;
}

export interface BookNote {
  id: number;
  userId: number;
  bookId: number;
  note: string;
  created_on: string;
  modified_on: string;
}
