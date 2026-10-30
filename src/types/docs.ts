export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  updatedAt: string;
}

export interface DocDetail extends DocMeta {
  content: string;
}

